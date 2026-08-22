package com.otprelay.ui.screens.welcome

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.OTPRelayApp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun WelcomeScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToDashboard: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isChecking by remember { mutableStateOf(true) }

    // Check auth state on first composition
    LaunchedEffect(Unit) {
        try {
            val app = context.applicationContext as OTPRelayApp
            val prefs = app.preferencesManager
            val isActivated = prefs.isActivated.first()
            val hasToken = prefs.accessToken.first()
            val userId = prefs.userId.first()

            if (isActivated && hasToken != null && userId != null) {
                Log.d("WelcomeScreen", "Auth state found, redirecting to Dashboard")
                onNavigateToDashboard?.invoke()
                return@LaunchedEffect
            }
        } catch (e: Exception) {
            Log.e("WelcomeScreen", "Error checking auth state", e)
        } finally {
            isChecking = false
        }
    }

    // Show loading while checking auth state
    if (isChecking) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                color = MaterialTheme.colorScheme.primary
            )
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Icon
        Icon(
            imageVector = Icons.Default.Security,
            contentDescription = "OTP Relay",
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // App Name
        Text(
            text = "OTP Relay",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Government Portal",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Description
        Text(
            text = "Securely relay authentication OTPs from government departments to office operators.",
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Only authorized sender IDs are processed.\nPersonal SMS messages are never uploaded.",
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Get Started Button
        Button(
            onClick = onNavigateToLogin,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                text = "GET STARTED",
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
    }
}
