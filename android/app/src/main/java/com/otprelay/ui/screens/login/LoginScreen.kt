package com.otprelay.ui.screens.login

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.OTPRelayApp
import com.otprelay.data.remote.ApiClient
import com.otprelay.data.model.LoginRequest
import com.otprelay.data.model.DeviceRegisterRequest
import android.os.Build
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        // Header
        Text(
            text = "Sign In",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Enter your credentials to continue",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
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
                    modifier = Modifier.padding(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Email field
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password field
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        if (passwordVisible) Icons.Default.VisibilityOff
                        else Icons.Default.Visibility,
                        contentDescription = "Toggle password"
                    )
                }
            },
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = if (passwordVisible) VisualTransformation.None
            else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Login button
        Button(
            onClick = {
                if (email.isBlank() || password.isBlank()) {
                    error = "Please enter email and password"
                    return@Button
                }

                isLoading = true
                error = null

                scope.launch {
                    try {
                        val response = app.apiService.login(
                            LoginRequest(email = email, password = password)
                        )

                        if (response.isSuccessful) {
                            val data = response.body()!!

                            // Save tokens
                            app.preferencesManager.saveAuthTokens(
                                data.access_token,
                                data.refresh_token
                            )

                            // Save user info
                            app.preferencesManager.saveUserInfo(
                                id = data.user.id,
                                email = data.user.email,
                                name = data.user.full_name,
                                role = data.user.role,
                                orgId = data.user.organization_id
                            )

                            // Set API client token
                            ApiClient.setAuthToken(data.access_token)

                            // Mark as activated (persists across app restarts)
                            app.preferencesManager.setActivated(true)

                            // Register device with server
                            try {
                                var deviceId = app.preferencesManager.deviceId.first()
                                if (deviceId == null) {
                                    deviceId = java.util.UUID.randomUUID().toString()
                                    app.preferencesManager.saveDeviceId(deviceId)
                                }
                                app.apiService.registerDevice(
                                    DeviceRegisterRequest(
                                        device_id = deviceId,
                                        activation_code = "DEFAULT",
                                        model = Build.MODEL,
                                        android_version = Build.VERSION.RELEASE,
                                        app_version = "1.0.0"
                                    )
                                )
                                Log.d("LoginScreen", "Device registered: $deviceId")
                            } catch (e: Exception) {
                                Log.w("LoginScreen", "Device registration failed (non-fatal): ${e.message}")
                            }

                            // Sync authorized senders from server
                            try {
                                val senderResponse = app.apiService.getSenderIds()
                                if (senderResponse.isSuccessful) {
                                    val senders = senderResponse.body()?.map { sender ->
                                        com.otprelay.data.local.AuthorizedSender(
                                            senderId = sender.sender_id,
                                            displayName = sender.display_name,
                                            serviceCode = sender.display_name,
                                            otpLength = sender.otp_length,
                                            extractionRegex = null,
                                            isAuthorized = true
                                        )
                                    } ?: emptyList()
                                    if (senders.isNotEmpty()) {
                                        app.database.authorizedSenderDao().deleteAll()
                                        app.database.authorizedSenderDao().insertSenders(senders)
                                        Log.d("LoginScreen", "Synced ${senders.size} authorized senders")
                                    }
                                }
                            } catch (e: Exception) {
                                Log.w("LoginScreen", "Sender sync failed (non-fatal): ${e.message}")
                            }

                            onLoginSuccess()
                        } else {
                            error = "Invalid email or password"
                        }
                    } catch (e: Exception) {
                        Log.e("LoginScreen", "Login failed", e)
                        error = "Connection error: ${e.message ?: "Unable to reach server"}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = !isLoading,
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
                    text = "SIGN IN",
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}
