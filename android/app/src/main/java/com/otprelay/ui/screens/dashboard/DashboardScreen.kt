package com.otprelay.ui.screens.dashboard

import android.util.Log
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.OTPRelayApp
import com.otprelay.data.local.PendingOtp
import com.otprelay.ui.components.UpdateDialog
import com.otprelay.ui.components.InstallDialog
import com.otprelay.util.OtpExtractor
import kotlinx.coroutines.flow.flowOf
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToActivity: () -> Unit,
    onNavigateToAuthorizations: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp

    // Recent OTPs - only 3 for home screen
    val recentOtps by remember {
        try {
            app.database.pendingOtpDao().getRecentOtps(3)
        } catch (e: Exception) {
            Log.e("DashboardScreen", "Failed to access database", e)
            flowOf(emptyList())
        }
    }.collectAsState(initial = emptyList())

    // Total count for "More" button
    var totalCount by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        try {
            totalCount = app.database.pendingOtpDao().getPendingCount()
        } catch (e: Exception) {
            Log.e("DashboardScreen", "Failed to get count", e)
        }
    }

    var pendingCount by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        try {
            pendingCount = app.database.pendingOtpDao().getPendingCount()
        } catch (e: Exception) {
            Log.e("DashboardScreen", "Failed to get pending count", e)
        }
    }

    // Update dialog state
    val updateInfo by app.availableUpdate.collectAsState()
    var showUpdateDialog by remember { mutableStateOf(false) }
    var isDownloading by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableIntStateOf(0) }
    var downloadedFilePath by remember { mutableStateOf<String?>(null) }
    var showInstallDialog by remember { mutableStateOf(false) }

    LaunchedEffect(updateInfo) {
        if (updateInfo != null) showUpdateDialog = true
    }

    if (showUpdateDialog && updateInfo != null) {
        UpdateDialog(
            version = updateInfo!!.version,
            releaseNotes = updateInfo!!.releaseNotes,
            isForceUpdate = updateInfo!!.isForceUpdate,
            isDownloading = isDownloading,
            downloadProgress = downloadProgress,
            onUpdateClick = {
                isDownloading = true
                // Set up callback for download completion
                app.updateManager.setDownloadCallback(object : com.otprelay.util.UpdateManager.UpdateCallback {
                    override fun onUpdateAvailable(version: com.otprelay.data.model.AppVersionResponse, isForceUpdate: Boolean) {}
                    override fun onNoUpdate() {}
                    override fun onDownloadComplete(filePath: String) {
                        isDownloading = false
                        downloadedFilePath = filePath
                        showUpdateDialog = false
                        showInstallDialog = true
                    }
                    override fun onDownloadFailed(error: String) {
                        isDownloading = false
                    }
                    override fun onInstallPrompt(filePath: String) {
                        isDownloading = false
                        downloadedFilePath = filePath
                        showUpdateDialog = false
                        showInstallDialog = true
                    }
                })
                updateInfo!!.downloadUrl?.let { app.updateManager.downloadApk(it) }
            },
            onSkipClick = { showUpdateDialog = false; app.clearUpdateNotification() },
            onDismiss = {
                if (!updateInfo!!.isForceUpdate) { showUpdateDialog = false; app.clearUpdateNotification() }
            }
        )
    }

    if (showInstallDialog && downloadedFilePath != null) {
        InstallDialog(
            version = updateInfo?.version ?: "unknown",
            onInstallClick = { app.updateManager.installApk(downloadedFilePath!!); showInstallDialog = false },
            onDismiss = { showInstallDialog = false }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("OTP Relay") },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Spacer for top padding
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // Status Card - Full width with good contrast
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "OTP Relay Active",
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatusItem(label = "Service", value = "Running", color = MaterialTheme.colorScheme.onPrimary)
                            StatusItem(label = "Pending", value = "$pendingCount OTPs", color = MaterialTheme.colorScheme.onPrimary)
                            StatusItem(label = "SMS", value = "Active", color = MaterialTheme.colorScheme.onPrimary)
                        }
                    }
                }
            }

            // Quick Actions
            item {
                Text(
                    text = "Quick Actions",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Security,
                        title = "Authorizations",
                        onClick = onNavigateToAuthorizations
                    )
                    ActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.History,
                        title = "Activity",
                        onClick = onNavigateToActivity
                    )
                }
            }

            // Recent OTPs header with More button
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent OTPs",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (totalCount > 3) {
                        TextButton(onClick = onNavigateToActivity) {
                            Text("View All ($totalCount)")
                            Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            if (recentOtps.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Inbox,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No OTPs yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "OTP messages will appear here when received",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(recentOtps) { otp ->
                    OtpCard(otp = otp)
                }
            }

            // Bottom spacer
            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
fun StatusItem(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = color)
        Text(text = label, fontSize = 11.sp, color = color.copy(alpha = 0.7f))
    }
}

@Composable
fun ActionCard(
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.secondary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun OtpCard(otp: PendingOtp) {
    val dateFormat = remember { SimpleDateFormat("dd MMM, HH:mm:ss", Locale.getDefault()) }

    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = otp.senderId,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = dateFormat.format(Date(otp.extractedAt)),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Text(
                text = OtpExtractor.maskOtp(otp.otpValue),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(8.dp))

            Icon(
                when (otp.syncStatus) {
                    "SYNCED" -> Icons.Default.CheckCircle
                    "FAILED" -> Icons.Default.Error
                    else -> Icons.Default.Sync
                },
                contentDescription = otp.syncStatus,
                tint = when (otp.syncStatus) {
                    "SYNCED" -> MaterialTheme.colorScheme.tertiary
                    "FAILED" -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                },
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
