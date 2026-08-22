package com.otprelay

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import androidx.work.Configuration
import androidx.work.WorkManager
import com.otprelay.data.local.AppDatabase
import com.otprelay.data.remote.ApiClient
import com.otprelay.data.remote.ApiService
import com.otprelay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class OTPRelayApp : Application(), Configuration.Provider {

    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    val database by lazy {
        try {
            AppDatabase.getDatabase(this)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize database", e)
            throw e
        }
    }

    val apiService by lazy {
        try {
            ApiClient.createApiService()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize API service", e)
            throw e
        }
    }

    val preferencesManager by lazy {
        try {
            PreferencesManager(this)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize preferences", e)
            throw e
        }
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(Log.INFO)
            .build()

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "OTP Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for new OTP messages"
                    enableVibration(true)
                }

                val notificationManager = getSystemService(NotificationManager::class.java)
                notificationManager.createNotificationChannel(channel)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create notification channel", e)
        }
    }

    companion object {
        const val TAG = "OTPRelayApp"
        const val CHANNEL_ID = "otp_notifications"
    }
}
