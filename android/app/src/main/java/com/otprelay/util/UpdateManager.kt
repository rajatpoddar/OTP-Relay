package com.otprelay.util

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import com.otprelay.OTPRelayApp
import com.otprelay.data.model.AppVersionResponse
import kotlinx.coroutines.flow.first
import java.io.File

/**
 * Handles app update checking, downloading, and installation.
 * 
 * Flow:
 * 1. Check server for latest version
 * 2. Compare with current app version
 * 3. Show update dialog (optional or force)
 * 4. Download APK in background
 * 5. Prompt user to install
 */
class UpdateManager(private val context: Context) {

    // Callback interface
    interface UpdateCallback {
        fun onUpdateAvailable(version: AppVersionResponse, isForceUpdate: Boolean)
        fun onNoUpdate()
        fun onDownloadComplete(filePath: String)
        fun onDownloadFailed(error: String)
        fun onInstallPrompt(filePath: String)
    }

    companion object {
        private const val TAG = "UpdateManager"
        private const val CURRENT_VERSION = "1.0.0" // Should match build.gradle versionName
    }

    private var downloadId: Long = -1
    private var callback: UpdateCallback? = null

    /**
     * Check for app updates from server
     */
    suspend fun checkForUpdates(callback: UpdateCallback) {
        this.callback = callback
        
        try {
            val app = context.applicationContext as? OTPRelayApp ?: return
            val response = app.apiService.getAppVersions()
            
            if (!response.isSuccessful) {
                Log.w(TAG, "Failed to check updates: ${response.code()}")
                callback.onNoUpdate()
                return
            }
            
            val versions = response.body() ?: emptyList()
            if (versions.isEmpty()) {
                Log.d(TAG, "No versions available")
                callback.onNoUpdate()
                return
            }
            
            // Get latest active version
            val latestVersion = versions.firstOrNull { it.is_active }
            if (latestVersion == null) {
                Log.d(TAG, "No active version found")
                callback.onNoUpdate()
                return
            }
            
            Log.d(TAG, "Latest version: ${latestVersion.version}, Current: $CURRENT_VERSION")
            
            // Compare versions
            if (isNewerVersion(latestVersion.version, CURRENT_VERSION)) {
                Log.d(TAG, "Update available: ${latestVersion.version}")
                callback.onUpdateAvailable(latestVersion, latestVersion.force_update)
            } else {
                Log.d(TAG, "App is up to date")
                callback.onNoUpdate()
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for updates", e)
            callback.onNoUpdate()
        }
    }

    /**
     * Compare version strings (e.g., "1.0.1" > "1.0.0")
     */
    private fun isNewerVersion(newVersion: String, currentVersion: String): Boolean {
        try {
            val newParts = newVersion.split(".").map { it.toIntOrNull() ?: 0 }
            val currentParts = currentVersion.split(".").map { it.toIntOrNull() ?: 0 }
            
            // Pad with zeros if needed
            val maxParts = maxOf(newParts.size, currentParts.size)
            val newPadded = newParts + List(maxParts - newParts.size) { 0 }
            val currentPadded = currentParts + List(maxParts - currentParts.size) { 0 }
            
            for (i in 0 until maxParts) {
                if (newPadded[i] > currentPadded[i]) return true
                if (newPadded[i] < currentPadded[i]) return false
            }
            return false
        } catch (e: Exception) {
            Log.e(TAG, "Error comparing versions", e)
            return false
        }
    }

    /**
     * Download APK from URL
     */
    fun downloadApk(url: String, fileName: String = "otp-relay-update.apk") {
        try {
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle("Downloading Update")
                .setDescription("OTP Relay is being updated...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
            
            downloadId = downloadManager.enqueue(request)
            Log.d(TAG, "Download started with ID: $downloadId")
            
            // Register receiver to track download progress
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == downloadId) {
                        handleDownloadComplete(downloadManager, id)
                        context.unregisterReceiver(this)
                    }
                }
            }
            
            context.registerReceiver(
                receiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_NOT_EXPORTED
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start download", e)
            callback?.onDownloadFailed(e.message ?: "Download failed")
        }
    }

    /**
     * Handle download completion
     */
    private fun handleDownloadComplete(downloadManager: DownloadManager, downloadId: Long) {
        try {
            val query = DownloadManager.Query().setFilterById(downloadId)
            val cursor: Cursor? = downloadManager.query(query)
            
            cursor?.use {
                if (it.moveToFirst()) {
                    val status = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    
                    when (status) {
                        DownloadManager.STATUS_SUCCESSFUL -> {
                            val filePath = it.getString(it.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_FILENAME))
                            Log.d(TAG, "Download completed: $filePath")
                            callback?.onDownloadComplete(filePath)
                            callback?.onInstallPrompt(filePath)
                        }
                        DownloadManager.STATUS_FAILED -> {
                            val reason = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                            Log.e(TAG, "Download failed with reason: $reason")
                            callback?.onDownloadFailed("Download failed (reason: $reason)")
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling download completion", e)
            callback?.onDownloadFailed(e.message ?: "Error processing download")
        }
    }

    /**
     * Install APK file
     */
    fun installApk(filePath: String) {
        try {
            val file = File(filePath)
            if (!file.exists()) {
                Log.e(TAG, "APK file not found: $filePath")
                callback?.onDownloadFailed("APK file not found")
                return
            }
            
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(
                    Uri.fromFile(file),
                    "application/vnd.android.package-archive"
                )
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            
            context.startActivity(intent)
            Log.d(TAG, "Install prompt shown for: $filePath")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to install APK", e)
            callback?.onDownloadFailed("Failed to open installer: ${e.message}")
        }
    }

    /**
     * Get the current app version
     */
    fun getCurrentVersion(): String = CURRENT_VERSION

    /**
     * Check if a specific version is installed
     */
    fun isVersionInstalled(version: String): Boolean {
        return CURRENT_VERSION == version
    }
}
