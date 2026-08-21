package com.otprelay.ui.screens.authorizations

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
import com.otprelay.data.local.AuthorizedSender
import com.otprelay.data.model.AuthorizeRequest
import kotlinx.coroutines.flow.collectAsState
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthorizationsScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp
    val scope = rememberCoroutineScope()

    val senders by app.database.authorizedSenderDao().getAllSenders().collectAsState(initial = emptyList())
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Authorizations") },
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
            // Description
            item {
                Text(
                    text = "Only the sender IDs you authorize will be processed by OTP Relay. Personal and unrelated SMS messages are not processed.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Sender Cards
            if (senders.isEmpty()) {
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
                                Icons.Default.Shield,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No Sender IDs Configured",
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Contact your Office Admin to configure sender IDs.",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(senders) { sender ->
                    SenderCard(
                        sender = sender,
                        onToggle = { authorized ->
                            scope.launch {
                                isLoading = true
                                try {
                                    // Update local DB
                                    app.database.authorizedSenderDao().updateAuthorization(
                                        sender.senderId,
                                        authorized
                                    )

                                    // Update server
                                    app.apiService.authorizeSender(
                                        AuthorizeRequest(
                                            sender_text = sender.senderId,
                                            status = if (authorized) "AUTHORIZED" else "NOT_AUTHORIZED"
                                        )
                                    )
                                } catch (e: Exception) {
                                    // Revert on error
                                    app.database.authorizedSenderDao().updateAuthorization(
                                        sender.senderId,
                                        !authorized
                                    )
                                } finally {
                                    isLoading = false
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun SenderCard(
    sender: AuthorizedSender,
    onToggle: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = sender.serviceCode ?: sender.senderId,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = sender.senderId,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (sender.isAuthorized) Icons.Default.CheckCircle
                        else Icons.Default.Cancel,
                        contentDescription = null,
                        tint = if (sender.isAuthorized) MaterialTheme.colorScheme.tertiary
                        else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (sender.isAuthorized) "Authorized" else "Not Authorized",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (sender.isAuthorized) MaterialTheme.colorScheme.tertiary
                        else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "OTP Length: ${sender.otpLength} digits",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = { onToggle(!sender.isAuthorized) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (sender.isAuthorized)
                        MaterialTheme.colorScheme.surface
                    else MaterialTheme.colorScheme.secondary
                )
            ) {
                Text(
                    text = if (sender.isAuthorized) "Revoke Authorization" else "Authorize",
                    color = if (sender.isAuthorized) MaterialTheme.colorScheme.onSurface
                    else MaterialTheme.colorScheme.onSecondary
                )
            }
        }
    }
}
