package com.otprelay.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.otprelay.OTPRelayApp
import com.otprelay.data.local.AuthorizedSender
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

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

        val app = context.applicationContext as OTPRelayApp
        val scope = CoroutineScope(Dispatchers.IO)

        scope.launch {
            try {
                // Get authorized senders from local DB
                val authorizedSenders = app.database.authorizedSenderDao().getAuthorizedSendersSync()

                for (sms in messages) {
                    val senderId = sms.displayOriginatingAddress ?: continue
                    val messageBody = sms.messageBody ?: continue

                    Log.d(TAG, "SMS received from: $senderId")

                    // Check if sender is authorized
                    val authorizedSender = OtpExtractor.findAuthorizedSender(senderId, authorizedSenders)

                    if (authorizedSender == null) {
                        Log.d(TAG, "Sender not authorized: $senderId - ignoring")
                        continue
                    }

                    Log.d(TAG, "Authorized sender detected: $senderId")

                    // Extract OTP
                    val extracted = OtpExtractor.extractOtp(messageBody, authorizedSender)

                    if (extracted.otpValue == null) {
                        Log.w(TAG, "Could not extract OTP from message")
                        continue
                    }

                    // Validate OTP length
                    if (!OtpExtractor.validateOtpLength(extracted.otpValue, authorizedSender.otpLength)) {
                        Log.w(TAG, "OTP length mismatch: expected ${authorizedSender.otpLength}, got ${extracted.otpValue.length}")
                        continue
                    }

                    // Store in local queue
                    val pendingOtp = PendingOtp(
                        senderId = senderId,
                        message = messageBody,
                        otpValue = extracted.otpValue,
                        extractedAt = System.currentTimeMillis(),
                        syncStatus = "PENDING"
                    )

                    app.database.pendingOtpDao().insertOtp(pendingOtp)

                    Log.d(TAG, "OTP queued for sync: ${extracted.otpValue.take(2)}••${extracted.otpValue.takeLast(2)}")

                    // Show notification
                    showNotification(context, senderId, extracted.otpValue, extracted.purpose)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing SMS", e)
            }
        }
    }

    private fun showNotification(context: Context, senderId: String, otp: String, purpose: String?) {
        val app = context.applicationContext as OTPRelayApp
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager

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

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}

// Extension function for synchronous query
private suspend fun com.otprelay.data.local.AuthorizedSenderDao.getAuthorizedSendersSync(): List<AuthorizedSender> {
    return this.getAllSendersSync()
}
