package com.otprelay

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import androidx.work.Configuration
import com.otprelay.data.local.AppDatabase
import com.otprelay.data.remote.ApiClient
import com.otprelay.data.remote.ApiService
import com.otprelay.service.RelayForegroundService
import com.otprelay.util.PreferencesManager
import com.otprelay.util.UpdateManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

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

    val updateManager by lazy {
        try {
            UpdateManager(this)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize update manager", e)
            throw e
        }
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(Log.INFO)
            .build()

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        restoreApiToken()
        startForegroundServiceIfNeeded()
        checkForUpdates()
    }

    /**
     * Start foreground service if user is already activated.
     * This ensures the service runs even if app is not in foreground.
     */
    private fun startForegroundServiceIfNeeded() {
        applicationScope.launch {
            try {
                val isActivated = preferencesManager.isActivated.first()
                if (isActivated) {
                    Log.d(TAG, "User activated - starting foreground service")
                    RelayForegroundService.start(this@OTPRelayApp)
                    // Register device on every app start (handles auto-login path too)
                    registerDeviceIfNeeded()
                } else {
                    Log.d(TAG, "User not activated - foreground service will start after login")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to check activation state", e)
            }
        }
    }

    /**
     * Register device with server on every app start.
     * This ensures device is always registered even on auto-login path.
     */
    private suspend fun registerDeviceIfNeeded() {
        try {
            var deviceId = preferencesManager.deviceId.first()
            if (deviceId == null) {
                deviceId = java.util.UUID.randomUUID().toString()
                preferencesManager.saveDeviceId(deviceId)
            }
            // Try staff registration first (JWT-based, no activation code needed)
            try {
                val staffResponse = apiService.registerDeviceForStaff(
                    com.otprelay.data.model.DeviceRegisterRequest(
                        device_id = deviceId,
                        activation_code = "STAFF",
                        model = android.os.Build.MODEL,
                        android_version = android.os.Build.VERSION.RELEASE,
                        app_version = BuildConfig.VERSION_NAME
                    )
                )
                if (staffResponse.isSuccessful) {
                    Log.d(TAG, "✅ Device registered via staff auth: $deviceId")
                    return
                } else {
                    Log.w(TAG, "Staff registration returned ${staffResponse.code()}")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Staff registration failed: ${e.message}")
            }
            // Fallback to activation code registration
            try {
                val fallbackResponse = apiService.registerDevice(
                    com.otprelay.data.model.DeviceRegisterRequest(
                        device_id = deviceId,
                        activation_code = "DEFAULT",
                        model = android.os.Build.MODEL,
                        android_version = android.os.Build.VERSION.RELEASE,
                        app_version = BuildConfig.VERSION_NAME
                    )
                )
                if (fallbackResponse.isSuccessful) {
                    Log.d(TAG, "✅ Device registered via activation code: $deviceId")
                } else {
                    Log.w(TAG, "Activation code registration returned ${fallbackResponse.code()}")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Activation code registration failed: ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Device registration error: ${e.message}")
        }
    }

    /**
     * Called after successful login to start the foreground service.
     */
    fun startServiceAfterLogin() {
        try {
            RelayForegroundService.start(this)
            Log.d(TAG, "Foreground service started after login")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground service after login", e)
        }
    }

    private fun restoreApiToken() {
        applicationScope.launch {
            try {
                preferencesManager.accessToken.first()?.let { token ->
                    ApiClient.setAuthToken(token)
                    Log.d(TAG, "API token restored from DataStore")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to restore API token", e)
            }
        }
    }

    /**
     * Check for app updates on launch.
     * This runs silently in the background.
     */
    private fun checkForUpdates() {
        applicationScope.launch {
            try {
                delay(3000) // Wait for app to fully initialize
                
                updateManager.checkForUpdates(object : UpdateManager.UpdateCallback {
                    override fun onUpdateAvailable(version: com.otprelay.data.model.AppVersionResponse, isForceUpdate: Boolean) {
                        Log.d(TAG, "Update available: ${version.version}")
                        // Store update info for UI to pick up
                        _availableUpdate.value = UpdateInfo(
                            version = version.version,
                            releaseNotes = version.release_notes,
                            downloadUrl = version.download_url,
                            isForceUpdate = isForceUpdate
                        )
                    }
                    
                    override fun onNoUpdate() {
                        Log.d(TAG, "App is up to date")
                    }
                    
                    override fun onDownloadComplete(filePath: String) {
                        Log.d(TAG, "Update downloaded: $filePath")
                    }
                    
                    override fun onDownloadFailed(error: String) {
                        Log.e(TAG, "Update download failed: $error")
                    }
                    
                    override fun onInstallPrompt(filePath: String) {
                        Log.d(TAG, "Update ready to install: $filePath")
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "Failed to check for updates", e)
            }
        }
    }

    private fun createNotificationChannels() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = getSystemService(NotificationManager::class.java)

                // Channel 1: OTP Notifications (high priority)
                val otpChannel = NotificationChannel(
                    CHANNEL_ID,
                    "OTP Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for new OTP messages"
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(otpChannel)

                // Channel 2: Service Status (low priority)
                val serviceChannel = NotificationChannel(
                    SERVICE_CHANNEL_ID,
                    "Service Status",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Background service status"
                    setShowBadge(false)
                }
                notificationManager.createNotificationChannel(serviceChannel)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create notification channels", e)
        }
    }

    // Observable update state for UI
    private val _availableUpdate = kotlinx.coroutines.flow.MutableStateFlow<UpdateInfo?>(null)
    val availableUpdate: kotlinx.coroutines.flow.StateFlow<UpdateInfo?> = _availableUpdate
    
    fun clearUpdateNotification() {
        _availableUpdate.value = null
    }
    
    data class UpdateInfo(
        val version: String,
        val releaseNotes: String?,
        val downloadUrl: String?,
        val isForceUpdate: Boolean
    )

    companion object {
        const val TAG = "OTPRelayApp"
        const val CHANNEL_ID = "otp_notifications"
        const val SERVICE_CHANNEL_ID = "relay_service_channel"
    }
}
