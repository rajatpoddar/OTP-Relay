package com.otprelay.worker

import android.content.Context
import android.util.Log
import androidx.work.*
import com.otprelay.OTPRelayApp
import com.otprelay.data.model.HeartbeatRequest
import com.otprelay.data.model.OtpEvent
import com.otprelay.data.model.SyncRequest
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "SyncWorker"
        private const val WORK_NAME = "otp_sync_work"

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request
                )
        }

        fun enqueueOneTime(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context)
                .enqueue(request)
        }
    }

    override suspend fun doWork(): Result {
        val app = applicationContext as OTPRelayApp
        val pendingOtpDao = app.database.pendingOtpDao()

        try {
            // Step 1: Send heartbeat (keep device alive)
            val deviceId = app.preferencesManager.deviceId.first()
            if (deviceId != null) {
                try {
                    app.apiService.sendHeartbeat(HeartbeatRequest(device_id = deviceId))
                    Log.d(TAG, "Heartbeat sent for device: $deviceId")
                } catch (e: Exception) {
                    Log.w(TAG, "Heartbeat failed (non-fatal): ${e.message}")
                }
            }

            // Step 2: Sync pending OTPs
            val pendingOtps = pendingOtpDao.getPendingOtps().first()

            if (pendingOtps.isEmpty()) {
                Log.d(TAG, "No pending OTPs to sync")
                return Result.success()
            }

            if (deviceId == null) {
                Log.w(TAG, "Device not registered, skipping OTP sync")
                return Result.retry()
            }

            Log.d(TAG, "Syncing ${pendingOtps.size} pending OTPs")

            // Sync each OTP
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
                        pendingOtpDao.markSynced(otp.id)
                        successCount++
                        Log.d(TAG, "OTP synced successfully")
                    } else {
                        pendingOtpDao.markFailed(
                            otp.id,
                            "HTTP ${response.code()}: ${response.message()}"
                        )
                        Log.w(TAG, "Failed to sync OTP: ${response.code()}")
                    }
                } catch (e: Exception) {
                    pendingOtpDao.markFailed(otp.id, e.message ?: "Unknown error")
                    Log.e(TAG, "Error syncing OTP", e)
                }
            }

            // Cleanup old synced OTPs (older than 7 days)
            val cutoff = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
            pendingOtpDao.cleanupSynced(cutoff)

            Log.d(TAG, "Sync complete: $successCount/${pendingOtps.size} synced")
            return Result.success()

        } catch (e: Exception) {
            Log.e(TAG, "Sync worker failed", e)
            return Result.retry()
        }
    }
}
