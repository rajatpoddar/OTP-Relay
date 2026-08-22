package com.otprelay.receiver

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.otprelay.OTPRelayApp
import com.otprelay.data.local.PendingOtp
import com.otprelay.util.OtpExtractor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
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
            try {
                val authorizedSenders = try {
                    app.database.authorizedSenderDao().getAllSendersSync()
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to query authorized senders", e)
                    emptyList()
                }

                if (authorizedSenders.isEmpty()) {
                    Log.d(TAG, "No authorized senders configured, ignoring SMS")
                    return@launch
                }

                for (sms in messages) {
                    val senderId = sms.displayOriginatingAddress ?: continue
                    val messageBody = sms.messageBody ?: continue

                    Log.d(TAG, "SMS received from: $senderId")

                    val authorizedSender = OtpExtractor.findAuthorizedSender(senderId, authorizedSenders)

                    if (authorizedSender == null) {
                        Log.d(TAG, "Sender not authorized: $senderId - ignoring")
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
                        Log.d(TAG, "OTP queued for sync: ${extracted.otpValue.take(2)}••${extracted.otpValue.takeLast(2)}")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to insert OTP to database", e)
                    }

                    showNotification(context, senderId, extracted.otpValue, extracted.purpose)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS", e)
            } finally {
                pendingResult.finish()
            }
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
