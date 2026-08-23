package com.otprelay.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.otprelay.service.RelayForegroundService
import com.otprelay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Restarts the foreground service after device reboot.
 * Also triggers a one-time sync to catch any missed OTPs.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        Log.d(TAG, "Boot completed - checking if service should restart")

        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val prefs = PreferencesManager(context)
                val isActivated = prefs.isActivated.first()
                val token = prefs.accessToken.first()

                if (isActivated && token != null) {
                    Log.d(TAG, "User is activated - starting foreground service")
                    
                    // Start foreground service
                    val serviceIntent = Intent(context, RelayForegroundService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                    
                    Log.d(TAG, "Foreground service started after boot")
                } else {
                    Log.d(TAG, "User not activated - skipping service start")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to restart service after boot", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
