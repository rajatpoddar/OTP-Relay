package com.otprelay.ui.screens.permissions

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.service.RelayForegroundService

@Composable
fun PermissionsScreen(
    onAllPermissionsGranted: () -> Unit
) {
    val context = LocalContext.current

    // Track permission states
    var smsPermissionGranted by remember { mutableStateOf(hasSmsPermission(context)) }
    var notificationPermissionGranted by remember { mutableStateOf(hasNotificationPermission(context)) }
    var batteryOptimizationDisabled by remember { mutableStateOf(isBatteryOptimizationDisabled(context)) }

    // Re-check battery optimization when screen resumes
    LaunchedEffect(Unit) {
        // Small delay to allow settings to apply
        kotlinx.coroutines.delay(500)
        batteryOptimizationDisabled = isBatteryOptimizationDisabled(context)
    }

    val allGranted = smsPermissionGranted && notificationPermissionGranted && batteryOptimizationDisabled

    // SMS permission launcher
    val smsPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allSmsGranted = permissions.values.all { it }
        smsPermissionGranted = allSmsGranted
        if (allSmsGranted) {
            try {
                RelayForegroundService.start(context)
            } catch (_: Exception) {}
        }
    }

    // Notification permission launcher (Android 13+)
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        notificationPermissionGranted = granted
    }

    // Battery optimization launcher - re-check when returning
    val batteryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) {
        // Re-check when returning from settings
        batteryOptimizationDisabled = isBatteryOptimizationDisabled(context)
    }

    // Auto-proceed when all permissions granted
    LaunchedEffect(allGranted) {
        if (allGranted) {
            onAllPermissionsGranted()
        }
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))

            // Icon
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Security,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Permissions Required",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "OTP Relay needs a few permissions to capture and relay OTPs from your phone.",
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // SMS Permission Card
            PermissionCard(
                title = "SMS Access",
                description = "Read incoming SMS to extract OTP codes from authorized government senders.",
                icon = Icons.Default.Sms,
                isGranted = smsPermissionGranted,
                onClick = {
                    smsPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.RECEIVE_SMS,
                            Manifest.permission.READ_SMS
                        )
                    )
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Notification Permission Card
            PermissionCard(
                title = "Notifications",
                description = "Show OTP received notifications and keep service status visible.",
                icon = Icons.Default.Notifications,
                isGranted = notificationPermissionGranted,
                onClick = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        notificationPermissionGranted = true
                    }
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Battery Optimization Card
            PermissionCard(
                title = "Battery Optimization",
                description = "Disable battery restrictions so service runs 24/7 even when phone is idle.",
                icon = Icons.Default.BatteryStd,
                isGranted = batteryOptimizationDisabled,
                onClick = {
                    try {
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = Uri.parse("package:${context.packageName}")
                        }
                        batteryLauncher.launch(intent)
                    } catch (e: Exception) {
                        // Fallback: open battery optimization settings directly
                        try {
                            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                            batteryLauncher.launch(intent)
                        } catch (_: Exception) {
                            // If all else fails, just mark as done
                            batteryOptimizationDisabled = true
                        }
                    }
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Continue button (always visible)
            Button(
                onClick = onAllPermissionsGranted,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (allGranted) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.secondary
                )
            ) {
                Text(
                    if (allGranted) "Continue" else "Skip for now",
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = if (allGranted) "All permissions granted!"
                else "You can grant permissions later from Settings.\nSMS permission is required for OTP capture.",
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = if (allGranted) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun PermissionCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isGranted: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isGranted)
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
            else
                MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (isGranted) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                        else MaterialTheme.colorScheme.errorContainer
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = if (isGranted) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Text
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 17.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Action button
            if (isGranted) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = "Granted",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(28.dp)
                )
            } else {
                FilledTonalButton(
                    onClick = onClick,
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Grant", fontSize = 13.sp)
                }
            }
        }
    }
}

private fun hasSmsPermission(context: Context): Boolean {
    return context.checkSelfPermission(Manifest.permission.RECEIVE_SMS) == android.content.pm.PackageManager.PERMISSION_GRANTED &&
            context.checkSelfPermission(Manifest.permission.READ_SMS) == android.content.pm.PackageManager.PERMISSION_GRANTED
}

private fun hasNotificationPermission(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED
    } else {
        true
    }
}

private fun isBatteryOptimizationDisabled(context: Context): Boolean {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(context.packageName)
}
