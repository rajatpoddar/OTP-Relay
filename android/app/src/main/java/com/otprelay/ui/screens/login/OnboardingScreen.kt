package com.otprelay.ui.screens.login

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.otprelay.data.model.AppOnboard
import kotlinx.coroutines.launch

@Composable
fun OnboardingScreen(
    onComplete: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var name by remember { mutableStateOf("") }
    var designation by remember { mutableStateOf("") }
    var department by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // Sender IDs available for selection
    var senderIds by remember { mutableStateOf<List<String>>(emptyList()) }
    var selectedSenders by remember { mutableStateOf<Set<String>>(emptySet()) }

    // Fetch available sender IDs from staff endpoint
    LaunchedEffect(Unit) {
        try {
            val response = app.apiService.getAvailableSenders()
            if (response.isSuccessful) {
                senderIds = response.body()?.map { it.sender_id } ?: emptyList()
                Log.d("Onboarding", "Fetched ${senderIds.size} available sender IDs")
            } else {
                Log.w("Onboarding", "Failed to fetch sender IDs: ${response.code()}")
            }
        } catch (e: Exception) {
            Log.w("Onboarding", "Failed to fetch sender IDs: ${e.message}")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(40.dp))

        // Header
        Icon(
            Icons.Default.PersonAdd,
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Complete Your Profile",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Please fill in your details to get started.\nThis helps route OTPs to the right operator.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Error message
        error?.let { err ->
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = err,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp),
                    fontSize = 13.sp
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Name field
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Full Name *") },
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("e.g. Rajesh Kumar") }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Designation field
        OutlinedTextField(
            value = designation,
            onValueChange = { designation = it },
            label = { Text("Designation") },
            leadingIcon = { Icon(Icons.Default.Badge, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("e.g. Village Resource Person") }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Department field
        OutlinedTextField(
            value = department,
            onValueChange = { department = it },
            label = { Text("Department") },
            leadingIcon = { Icon(Icons.Default.Business, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            placeholder = { Text("e.g. Rural Development") }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Sender ID selection
        if (senderIds.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Select Authorized Sender IDs",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Choose the sender IDs you want to relay OTPs for:",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    senderIds.forEach { senderId ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = senderId in selectedSenders,
                                onCheckedChange = { checked ->
                                    selectedSenders = if (checked) {
                                        selectedSenders + senderId
                                    } else {
                                        selectedSenders - senderId
                                    }
                                }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = senderId,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Save & Continue button
        Button(
            onClick = {
                if (name.isBlank()) {
                    error = "Please enter your name"
                    return@Button
                }

                isLoading = true
                error = null

                scope.launch {
                    try {
                        val response = app.apiService.appOnboard(
                            AppOnboard(
                                name = name,
                                designation = designation.ifBlank { null },
                                department_id = null,
                                sender_ids = selectedSenders.ifEmpty { null }?.toList()
                            )
                        )

                        if (response.isSuccessful) {
                            // Start foreground service after onboarding
                            try {
                                app.startServiceAfterLogin()
                                Log.d("Onboarding", "Foreground service started")
                            } catch (e: Exception) {
                                Log.w("Onboarding", "Failed to start foreground service: ${e.message}")
                            }

                            onComplete()
                        } else {
                            val errorMsg = response.errorBody()?.string()
                            error = "Failed to save profile: ${errorMsg ?: response.message()}"
                        }
                    } catch (e: Exception) {
                        Log.e("Onboarding", "Onboarding failed", e)
                        error = "Connection error: ${e.message ?: "Unable to reach server"}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = !isLoading && name.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text(
                    text = "SAVE & CONTINUE",
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Skip button
        TextButton(
            onClick = {
                scope.launch {
                    try {
                        app.startServiceAfterLogin()
                    } catch (e: Exception) {
                        Log.w("Onboarding", "Failed to start foreground service: ${e.message}")
                    }
                    onComplete()
                }
            }
        ) {
            Text("Skip for now", fontSize = 13.sp)
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}
