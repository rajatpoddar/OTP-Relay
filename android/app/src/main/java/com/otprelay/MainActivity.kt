package com.otprelay

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.otprelay.ui.navigation.OTPRelayNavGraph
import com.otprelay.ui.theme.OTPRelayTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ALWAYS start at Welcome - no runBlocking on main thread
        // The auth check happens inside the Compose tree via LaunchedEffect
        setContent {
            OTPRelayTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    OTPRelayNavGraph()
                }
            }
        }
    }

}
