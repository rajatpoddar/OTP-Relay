package com.otprelay.ui.screens.login

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.BuildConfig
import com.otprelay.OTPRelayApp
import com.otprelay.data.remote.ApiClient
import com.otprelay.data.model.AppVerifyOTP
import com.otprelay.data.model.AppRequestOTP
import android.os.Build
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun OtpVerificationScreen(
    mobileNumber: String,
    onVerified: (isNewUser: Boolean) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp
    val scope = rememberCoroutineScope()

    var otp by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var countdown by remember { mutableIntStateOf(60) }

    // Countdown timer for resend
    LaunchedEffect(Unit) {
        while (countdown > 0) {
            kotlinx.coroutines.delay(1000L)
            countdown--
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Back button
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Text(
                text = "Back",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Header
        Icon(
            Icons.Default.Lock,
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Enter OTP",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Ask your operator for the 6-digit OTP\nsent to $mobileNumber",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
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

        // OTP input field
        OutlinedTextField(
            value = otp,
            onValueChange = { if (it.length <= 6) otp = it.filter { c -> c.isDigit() } },
            label = { Text("6-Digit OTP") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            textStyle = LocalTextStyle.current.copy(
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 8.sp,
                textAlign = TextAlign.Center
            )
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Verify OTP button
        Button(
            onClick = {
                if (otp.length != 6) {
                    error = "Please enter the complete 6-digit OTP"
                    return@Button
                }

                isLoading = true
                error = null

                scope.launch {
                    try {
                        val response = app.apiService.appVerifyOtp(
                            AppVerifyOTP(mobile_number = mobileNumber, otp = otp)
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

                            // Mark as activated
                            app.preferencesManager.setActivated(true)

                            // Register device with server
                            try {
                                var deviceId = app.preferencesManager.deviceId.first()
                                if (deviceId == null) {
                                    deviceId = java.util.UUID.randomUUID().toString()
                                    app.preferencesManager.saveDeviceId(deviceId)
                                }
                                try {
                                    app.apiService.registerDeviceForStaff(
                                        com.otprelay.data.model.DeviceRegisterRequest(
                                            device_id = deviceId,
                                            activation_code = "STAFF",
                                            model = Build.MODEL,
                                            android_version = Build.VERSION.RELEASE,
                                            app_version = BuildConfig.VERSION_NAME
                                        )
                                    )
                                    Log.d("OtpVerification", "Device registered via staff auth")
                                } catch (e: Exception) {
                                    Log.w("OtpVerification", "Staff registration failed: ${e.message}")
                                    try {
                                        app.apiService.registerDevice(
                                            com.otprelay.data.model.DeviceRegisterRequest(
                                                device_id = deviceId,
                                                activation_code = "DEFAULT",
                                                model = Build.MODEL,
                                                android_version = Build.VERSION.RELEASE,
                                                app_version = BuildConfig.VERSION_NAME
                                            )
                                        )
                                    } catch (e2: Exception) {
                                        Log.e("OtpVerification", "All device registration failed: ${e2.message}")
                                    }
                                }
                            } catch (e: Exception) {
                                Log.e("OtpVerification", "Device registration error: ${e.message}")
                            }

                            // Sync only this staff's authorized senders with operator routing info
                            try {
                                val senderResponse = app.apiService.getMySenders()
                                if (senderResponse.isSuccessful) {
                                    val senders = senderResponse.body()?.map { sender ->
                                        com.otprelay.data.local.AuthorizedSender(
                                            senderId = sender.sender_id,
                                            displayName = sender.display_name,
                                            serviceCode = sender.display_name,
                                            otpLength = sender.otp_length,
                                            extractionRegex = sender.extraction_regex,
                                            isAuthorized = sender.is_authorized,
                                            routedTo = sender.routed_to?.joinToString(", ")
                                        )
                                    } ?: emptyList()
                                    app.database.authorizedSenderDao().deleteAll()
                                    if (senders.isNotEmpty()) {
                                        app.database.authorizedSenderDao().insertSenders(senders)
                                    }
                                    Log.d("OtpVerification", "Synced ${senders.size} authorized senders")
                                }
                            } catch (e: Exception) {
                                Log.w("OtpVerification", "Sender sync failed: ${e.message}")
                            }

                            // Navigate based on profile status
                            onVerified(data.is_new_user)
                        } else {
                            val errorMsg = response.errorBody()?.string()
                            error = when (response.code()) {
                                400 -> "Invalid or expired OTP"
                                else -> "Error: ${errorMsg ?: response.message()}"
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("OtpVerification", "OTP verification failed", e)
                        error = "Connection error: ${e.message ?: "Unable to reach server"}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = !isLoading && otp.length == 6,
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
                    text = "VERIFY & LOGIN",
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Resend OTP
        if (countdown > 0) {
            Text(
                text = "Resend OTP in ${countdown}s",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            TextButton(
                onClick = {
                    countdown = 60
                    error = null
                    scope.launch {
                        try {
                            app.apiService.appRequestOtp(
                                AppRequestOTP(mobile_number = mobileNumber)
                            )
                        } catch (e: Exception) {
                            Log.w("OtpVerification", "Resend OTP failed: ${e.message}")
                        }
                    }
                }
            ) {
                Text("Resend OTP", fontWeight = FontWeight.Bold)
            }
        }
    }
}
