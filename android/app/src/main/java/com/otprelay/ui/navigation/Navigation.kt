package com.otprelay.ui.navigation

import android.util.Log
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.otprelay.ui.screens.activity.OtpActivityScreen
import com.otprelay.ui.screens.authorizations.AuthorizationsScreen
import com.otprelay.ui.screens.consent.ConsentScreen
import com.otprelay.ui.screens.dashboard.DashboardScreen
import com.otprelay.ui.screens.login.LoginScreen
import com.otprelay.ui.screens.login.OtpVerificationScreen
import com.otprelay.ui.screens.login.OnboardingScreen
import com.otprelay.ui.screens.permissions.PermissionsScreen
import com.otprelay.ui.screens.settings.SettingsScreen
import com.otprelay.ui.screens.welcome.WelcomeScreen
import kotlinx.coroutines.flow.first

sealed class Screen(val route: String) {
    object Consent : Screen("consent")
    object Welcome : Screen("welcome")
    object Login : Screen("login")
    object OtpVerification : Screen("otp_verification/{mobileNumber}")
    object Onboarding : Screen("onboarding")
    object Permissions : Screen("permissions")
    object Dashboard : Screen("dashboard")
    object Authorizations : Screen("authorizations")
    object Activity : Screen("activity")
    object Settings : Screen("settings")
}

@Composable
fun OTPRelayNavGraph(
    navController: NavHostController = rememberNavController()
) {
    var startDestination by remember { mutableStateOf<String?>(null) }

    // Check consent status on first composition
    LaunchedEffect(Unit) {
        try {
            val context = navController.context
            val app = context.applicationContext as com.otprelay.OTPRelayApp
            val consentGiven = app.preferencesManager.consentGiven.first()
            startDestination = if (consentGiven) Screen.Welcome.route else Screen.Consent.route
        } catch (e: Exception) {
            Log.e("NavGraph", "Error checking consent", e)
            startDestination = Screen.Welcome.route
        }
    }

    // Show loading while checking
    if (startDestination == null) {
        androidx.compose.foundation.layout.Box(
            modifier = androidx.compose.ui.Modifier.fillMaxSize(),
            contentAlignment = androidx.compose.ui.Alignment.Center
        ) {
            androidx.compose.material3.CircularProgressIndicator()
        }
        return
    }

    NavHost(
        navController = navController,
        startDestination = startDestination!!
    ) {
        composable(Screen.Consent.route) {
            ConsentScreen(
                onConsentGiven = {
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(Screen.Consent.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onNavigateToPermissions = {
                    navController.navigate(Screen.Permissions.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Permissions.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToOtpVerification = { mobileNumber ->
                    navController.navigate("otp_verification/$mobileNumber") {
                        popUpTo(Screen.Login.route) { inclusive = false }
                    }
                }
            )
        }

        composable(Screen.OtpVerification.route) { backStackEntry ->
            val mobileNumber = backStackEntry.arguments?.getString("mobileNumber") ?: ""
            OtpVerificationScreen(
                mobileNumber = mobileNumber,
                onVerified = { isNewUser ->
                    if (isNewUser) {
                        navController.navigate(Screen.Onboarding.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Screen.Permissions.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onComplete = {
                    navController.navigate(Screen.Permissions.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Permissions.route) {
            PermissionsScreen(
                onAllPermissionsGranted = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Permissions.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToActivity = { navController.navigate(Screen.Activity.route) },
                onNavigateToAuthorizations = { navController.navigate(Screen.Authorizations.route) },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(Screen.Authorizations.route) {
            AuthorizationsScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Activity.route) {
            OtpActivityScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Consent.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
