package com.otprelay.ui.screens.login

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.otprelay.OTPRelayApp
import com.otprelay.data.remote.ApiClient
import com.otprelay.data.model.AppRequestOTP
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToOtpVerification: (mobileNumber: String) -> Unit = {}
) {
    val context = LocalContext.current
    val app = context.applicationContext as OTPRelayApp
    val scope = rememberCoroutineScope()

    var mobileNumber by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        // App Logo / Header
        Text(
            text = "OTP Relay",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Staff Mobile Login",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Enter your registered mobile number.\nOperator will share the OTP with you.",
            fontSize = 13.sp,
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
                    modifier = Modifier.padding(16.dp),
                    fontSize = 13.sp
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Success message
        successMessage?.let { msg ->
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = msg,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(16.dp),
                    fontSize = 13.sp
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Mobile Number field
        OutlinedTextField(
            value = mobileNumber,
            onValueChange = { mobileNumber = it.filter { c -> c.isDigit() || c == '+' } },
            label = { Text("Mobile Number") },
            leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            placeholder = { Text("e.g. 9876543210") }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Request OTP button
        Button(
            onClick = {
                if (mobileNumber.isBlank() || mobileNumber.length < 10) {
                    error = "Please enter a valid 10-digit mobile number"
                    return@Button
                }

                isLoading = true
                error = null
                successMessage = null

                scope.launch {
                    try {
                        val response = app.apiService.appRequestOtp(
                            AppRequestOTP(mobile_number = mobileNumber)
                        )

                        if (response.isSuccessful) {
                            val data = response.body()!!
                            successMessage = data.message ?: "OTP sent. Ask your operator for the code."
                            // Navigate to OTP verification screen
                            onNavigateToOtpVerification(mobileNumber)
                        } else {
                            val errorMsg = response.errorBody()?.string()
                            error = when (response.code()) {
                                404 -> "No staff account found with this mobile number"
                                400 -> "Invalid mobile number"
                                else -> "Error: ${errorMsg ?: response.message()}"
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("LoginScreen", "Request OTP failed", e)
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
                    text = "REQUEST OTP",
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Info text
        Text(
            text = "💡 How it works:\n1. Enter your mobile number\n2. Ask your operator for the OTP\n3. Enter the OTP to log in",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            lineHeight = 18.sp
        )
    }
}
