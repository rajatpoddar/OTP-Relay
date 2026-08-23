package com.otprelay.receiver

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.util.Log
import com.otprelay.OTPRelayApp
import com.otprelay.data.local.PendingOtp
import com.otprelay.data.model.HeartbeatRequest
import com.otprelay.data.model.OtpEvent
import com.otprelay.data.model.SyncRequest
import com.otprelay.service.RelayForegroundService
import com.otprelay.util.OtpExtractor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class SMSReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SMSReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = try {
            Telephony.Sms.Intents.getMessagesFromIntent(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse SMS intent", e)
            return
        }

        val app = try {
            context.applicationContext as? OTPRelayApp
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get application context", e)
            return
        } ?: return

        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            var otpCaptured = false
            try {
                val authorizedSenders = try {
                    app.database.authorizedSenderDao().getAllSendersSync()
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to query authorized senders", e)
                    emptyList()
                }

                if (authorizedSenders.isEmpty()) {
                    Log.w(TAG, "⚠️ No authorized senders configured in local DB! SMS will be ignored.")
                    Log.w(TAG, "Check: 1) Login successful? 2) getSenderIds API returned data? 3) Server has sender IDs configured?")
                    for (sms in messages) {
                        Log.d(TAG, "  Ignored SMS from: ${sms.displayOriginatingAddress} (no senders configured)")
                    }
                    return@launch
                }

                Log.d(TAG, "📋 Authorized senders count: ${authorizedSenders.size}")
                for (sender in authorizedSenders) {
                    Log.d(TAG, "  - ${sender.senderId} (${sender.displayName})")
                }

                for (sms in messages) {
                    val senderId = sms.displayOriginatingAddress ?: continue
                    val messageBody = sms.messageBody ?: continue

                    Log.d(TAG, "SMS received from: $senderId")
                    Log.d(TAG, "Message preview: ${messageBody.take(80)}...")

                    val authorizedSender = OtpExtractor.findAuthorizedSender(senderId, authorizedSenders)

                    if (authorizedSender == null) {
                        Log.w(TAG, "❌ Sender NOT authorized: '$senderId' - ignoring")
                        Log.w(TAG, "   Authorized sender IDs: ${authorizedSenders.map { it.senderId }.joinToString()}")
                        continue
                    }

                    Log.d(TAG, "Authorized sender detected: $senderId")

                    val extracted = OtpExtractor.extractOtp(messageBody, authorizedSender)

                    if (extracted.otpValue == null) {
                        Log.w(TAG, "Could not extract OTP from message")
                        continue
                    }

                    if (!OtpExtractor.validateOtpLength(extracted.otpValue, authorizedSender.otpLength)) {
                        Log.w(TAG, "OTP length mismatch: expected ${authorizedSender.otpLength}, got ${extracted.otpValue.length}")
                        continue
                    }

                    val pendingOtp = PendingOtp(
                        senderId = senderId,
                        message = messageBody,
                        otpValue = extracted.otpValue,
                        extractedAt = System.currentTimeMillis(),
                        syncStatus = "PENDING"
                    )

                    try {
                        app.database.pendingOtpDao().insertOtp(pendingOtp)
                        otpCaptured = true
                        Log.d(TAG, "OTP queued for sync: ${extracted.otpValue.take(2)}••${extracted.otpValue.takeLast(2)}")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to insert OTP to database", e)
                    }

                    showNotification(context, senderId, extracted.otpValue, extracted.purpose)
                }

                // ⚡ IMMEDIATE SYNC: If OTP was captured, sync to server right now
                if (otpCaptured) {
                    Log.d(TAG, "✅ OTP captured - triggering immediate sync to server")
                    syncOtpImmediately(context, app)
                } else {
                    Log.w(TAG, "⚠️ SMS received but no OTP extracted - check sender config and OTP patterns")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    /**
     * Sync OTP to server immediately (don't wait for periodic sync).
     * This ensures OTP appears on operator dashboard within seconds.
     */
    private suspend fun syncOtpImmediately(context: Context, app: OTPRelayApp) {
        try {
            val deviceId = app.preferencesManager.deviceId.first()
            if (deviceId == null) {
                Log.e(TAG, "❌ Device NOT registered (no device_id in preferences)! Cannot sync.")
                Log.e(TAG, "   This means device registration failed during login.")
                try {
                    RelayForegroundService.start(context)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to start foreground service", e)
                }
                return
            }
            Log.d(TAG, "Device ID: $deviceId")

            // Get all pending OTPs
            val pendingOtps = app.database.pendingOtpDao().getPendingOtps().first()
            if (pendingOtps.isEmpty()) {
                Log.d(TAG, "No pending OTPs to sync")
                return
            }

            Log.d(TAG, "Immediate sync: ${pendingOtps.size} OTPs")

            var successCount = 0
            for (otp in pendingOtps) {
                try {
                    val request = SyncRequest(
                        device_id = deviceId,
                        otp_events = listOf(
                            OtpEvent(
                                sender_id = otp.senderId,
                                message = otp.message,
                                timestamp = java.time.Instant.ofEpochMilli(otp.extractedAt).toString()
                            )
                        )
                    )

                    val response = app.apiService.syncOtps(request)

                    if (response.isSuccessful) {
                        app.database.pendingOtpDao().markSynced(otp.id)
                        successCount++
                        Log.d(TAG, "✅ OTP synced immediately: ${otp.senderId}")
                    } else {
                        val errorBody = response.errorBody()?.string() ?: response.message()
                        Log.e(TAG, "❌ Failed to sync OTP: HTTP ${response.code()} - $errorBody")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error syncing OTP immediately", e)
                }
            }

            if (successCount > 0) {
                Log.d(TAG, "Immediate sync complete: $successCount OTPs synced")
                // Show success notification
                showSyncNotification(context, successCount)
            }

            // Also send heartbeat to update last_seen
            try {
                app.apiService.sendHeartbeat(HeartbeatRequest(device_id = deviceId))
                Log.d(TAG, "Heartbeat sent after sync")
            } catch (e: Exception) {
                Log.w(TAG, "Heartbeat failed after sync", e)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Immediate sync failed", e)
            // Fallback: start foreground service which will retry
            try {
                RelayForegroundService.start(context)
            } catch (e2: Exception) {
                Log.w(TAG, "Failed to start foreground service as fallback", e2)
            }
        }
    }

    private fun showSyncNotification(context: Context, count: Int) {
        try {
            val notification = android.app.Notification.Builder(context, OTPRelayApp.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("OTP Synced")
                .setContentText("$count OTP${if (count > 1) "s" else ""} sent to server")
                .setPriority(android.app.Notification.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show sync notification", e)
        }
    }

    private fun showNotification(context: Context, senderId: String, otp: String, purpose: String?) {
        try {
            val maskedOtp = OtpExtractor.maskOtp(otp)
            val title = "New OTP from $senderId"
            val text = buildString {
                append("OTP: $maskedOtp")
                purpose?.let { append("\nPurpose: $it") }
            }

            val notification = android.app.Notification.Builder(context, OTPRelayApp.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(text)
                .setPriority(android.app.Notification.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show notification", e)
        }
    }
}
