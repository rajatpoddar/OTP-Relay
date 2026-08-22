package com.otprelay

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.otprelay.ui.navigation.OTPRelayNavGraph
import com.otprelay.ui.navigation.Screen
import com.otprelay.ui.theme.OTPRelayTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Determine startup destination based on auth state
        val startRoute = determineStartRoute()

        setContent {
            OTPRelayTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    OTPRelayNavGraph(startDestination = startRoute)
                }
            }
        }
    }

    private fun determineStartRoute(): String {
        return try {
            val app = applicationContext as OTPRelayApp
            val prefs = app.preferencesManager

            // Read preferences synchronously for startup
            val isActivated = runBlocking { prefs.isActivated.first() }
            val hasToken = runBlocking { prefs.accessToken.first() }
            val userId = runBlocking { prefs.userId.first() }

            when {
                // Not activated or no token → Welcome/Login
                !isActivated || hasToken == null || userId == null -> {
                    Log.d(TAG, "Startup: No auth state, showing Welcome")
                    Screen.Welcome.route
                }
                // Has valid auth state → Dashboard
                else -> {
                    Log.d(TAG, "Startup: Auth state found, routing to Dashboard")
                    Screen.Dashboard.route
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error determining start route, defaulting to Welcome", e)
            Screen.Welcome.route
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
