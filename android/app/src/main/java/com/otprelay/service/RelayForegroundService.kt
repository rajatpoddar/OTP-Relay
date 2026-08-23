package com.otprelay.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.otprelay.MainActivity
import com.otprelay.OTPRelayApp
import com.otprelay.R
import com.otprelay.data.local.PendingOtp
import com.otprelay.data.model.HeartbeatRequest
import com.otprelay.data.model.OtpEvent
import com.otprelay.data.model.SyncRequest
import com.otprelay.worker.SyncWorker
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first

/**
 * Foreground Service that keeps the OTP Relay app alive 24/7.
 * 
 * Responsibilities:
 * 1. Keep app alive in background (prevents Android from killing it)
 * 2. Send heartbeat to server every 5 minutes
 * 3. Sync pending OTPs immediately (not wait 15 min)
 * 4. Wake up screen when new OTP arrives (optional)
 */
class RelayForegroundService : Service() {

    companion object {
        private const val TAG = "RelayService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "relay_service_channel"
        private const val ACTION_STOP = "com.otprelay.STOP_SERVICE"
        
        // Intervals
        private const val HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000L // 5 minutes
        private const val SYNC_CHECK_INTERVAL_MS = 30 * 1000L // 30 seconds
        
        fun start(context: Context) {
            val intent = Intent(context, RelayForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
        
        fun stop(context: Context) {
            context.stopService(Intent(context, RelayForegroundService::class.java))
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var heartbeatJob: Job? = null
    private var syncJob: Job? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "RelayForegroundService created")
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        Log.d(TAG, "RelayForegroundService started")
        
        // Start as foreground immediately
        startForeground(NOTIFICATION_ID, buildNotification("OTP Relay Active - Monitoring SMS"))
        
        // Start background tasks
        startHeartbeatLoop()
        startSyncLoop()
        
        // Sync pending OTPs immediately on service start
        serviceScope.launch {
            delay(2000) // Wait for app initialization
            syncPendingOtps()
        }
        
        // If service is killed, restart it
        return START_STICKY
    }

    override fun onDestroy() {
        Log.d(TAG, "RelayForegroundService destroyed")
        heartbeatJob?.cancel()
        syncJob?.cancel()
        releaseWakeLock()
        super.onDestroy()
    }

    // ==================== HEARTBEAT ====================
    
    private fun startHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                try {
                    sendHeartbeat()
                } catch (e: Exception) {
                    Log.e(TAG, "Heartbeat failed", e)
                }
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
        Log.d(TAG, "Heartbeat loop started (every ${HEARTBEAT_INTERVAL_MS / 1000}s)")
    }

    private suspend fun sendHeartbeat() {
        val app = application as? OTPRelayApp ?: return
        val deviceId = app.preferencesManager.deviceId.first() ?: return
        
        try {
            val response = app.apiService.sendHeartbeat(HeartbeatRequest(device_id = deviceId))
            if (response.isSuccessful) {
                Log.d(TAG, "Heartbeat sent successfully")
                updateNotification("OTP Relay Active - Last sync: ${java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Heartbeat failed: ${e.message}")
        }
    }

    // ==================== OTP SYNC ====================
    
    private fun startSyncLoop() {
        syncJob?.cancel()
        syncJob = serviceScope.launch {
            while (isActive) {
                try {
                    syncPendingOtps()
                } catch (e: Exception) {
                    Log.e(TAG, "Sync check failed", e)
                }
                delay(SYNC_CHECK_INTERVAL_MS)
            }
        }
        Log.d(TAG, "Sync loop started (every ${SYNC_CHECK_INTERVAL_MS / 1000}s)")
    }

    private suspend fun syncPendingOtps() {
        val app = application as? OTPRelayApp ?: return
        
        val pendingOtps = try {
            app.database.pendingOtpDao().getPendingOtps().first()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to query pending OTPs", e)
            return
        }
        
        if (pendingOtps.isEmpty()) {
            Log.d(TAG, "No pending OTPs to sync")
            return
        }
        
        val deviceId = app.preferencesManager.deviceId.first()
        if (deviceId == null) {
            Log.w(TAG, "Device not registered, cannot sync")
            return
        }
        
        Log.d(TAG, "Syncing ${pendingOtps.size} pending OTPs...")
        
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
                    Log.d(TAG, "OTP synced: ${otp.senderId}")
                } else {
                    app.database.pendingOtpDao().markFailed(
                        otp.id,
                        "HTTP ${response.code()}: ${response.message()}"
                    )
                    Log.w(TAG, "Failed to sync OTP: ${response.code()}")
                }
            } catch (e: Exception) {
                app.database.pendingOtpDao().markFailed(otp.id, e.message ?: "Unknown error")
                Log.e(TAG, "Error syncing OTP", e)
            }
        }
        
        if (successCount > 0) {
            updateNotification("OTP Relay Active - Synced $successCount OTP${if (successCount > 1) "s" else ""}")
            Log.d(TAG, "Sync complete: $successCount/${pendingOtps.size} synced")
        }
        
        // Cleanup old synced OTPs (older than 7 days)
        val cutoff = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
        try {
            app.database.pendingOtpDao().cleanupSynced(cutoff)
        } catch (e: Exception) {
            Log.w(TAG, "Cleanup failed", e)
        }
    }

    /**
     * Public method to trigger immediate sync (called from SMSReceiver)
     */
    fun triggerImmediateSync() {
        serviceScope.launch {
            delay(500) // Small delay to ensure OTP is saved to DB
            syncPendingOtps()
        }
    }

    // ==================== NOTIFICATION ====================
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "OTP Relay Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps OTP Relay running in background"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        // Intent to open app when notification is tapped
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Intent to stop service
        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, RelayForegroundService::class.java).apply {
                action = ACTION_STOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OTP Relay")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    // ==================== WAKE LOCK ====================
    
    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "OTPRelay::ServiceWakeLock"
        ).apply {
            acquire(10 * 60 * 1000L) // 10 minutes, will be renewed
        }
        Log.d(TAG, "Wake lock acquired")
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, "Wake lock released")
            }
        }
        wakeLock = null
    }
}
