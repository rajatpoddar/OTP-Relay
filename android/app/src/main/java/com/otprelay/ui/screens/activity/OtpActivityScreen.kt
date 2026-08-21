package com.otprelay.ui.screens.activity

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.OTPRelayApp
import com.otprelay.data.local.PendingOtp
import com.otprelay.util.OtpExtractor
import kotlinx.coroutines.flow.collectAsState
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OtpActivityScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp

    val otps by app.database.pendingOtpDao().getRecentOtps(100).collectAsState(initial = emptyList())
    val pendingCount = otps.count { it.syncStatus == "PENDING" }
    val syncedCount = otps.count { it.syncStatus == "SYNCED" }
    val failedCount = otps.count { it.syncStatus == "FAILED" }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("OTP Activity") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Stats
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label = "Total",
                        count = otps.size,
                        color = MaterialTheme.colorScheme.primary
                    )
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label = "Synced",
                        count = syncedCount,
                        color = MaterialTheme.colorScheme.tertiary
                    )
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label = "Pending",
                        count = pendingCount,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label = "Failed",
                        count = failedCount,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            // OTP List
            if (otps.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.History,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No OTP activity yet",
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(otps) { otp ->
                    OtpActivityCard(otp = otp)
                }
            }
        }
    }
}

@Composable
fun StatChip(
    modifier: Modifier = Modifier,
    label: String,
    count: Int,
    color: androidx.compose.ui.graphics.Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                fontSize = 10.sp,
                color = color
            )
        }
    }
}

@Composable
fun OtpActivityCard(otp: PendingOtp) {
    val dateFormat = remember { SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()) }

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status icon
            Icon(
                when (otp.syncStatus) {
                    "SYNCED" -> Icons.Default.CheckCircle
                    "FAILED" -> Icons.Default.Error
                    else -> Icons.Default.Schedule
                },
                contentDescription = null,
                tint = when (otp.syncStatus) {
                    "SYNCED" -> MaterialTheme.colorScheme.tertiary
                    "FAILED" -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.secondary
                },
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = otp.senderId,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = dateFormat.format(Date(otp.extractedAt)),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // OTP Value
            Text(
                text = OtpExtractor.maskOtp(otp.otpValue),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
