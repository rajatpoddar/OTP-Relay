package com.otprelay.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.otprelay.ui.screens.activity.OtpActivityScreen
import com.otprelay.ui.screens.authorizations.AuthorizationsScreen
import com.otprelay.ui.screens.dashboard.DashboardScreen
import com.otprelay.ui.screens.login.LoginScreen
import com.otprelay.ui.screens.settings.SettingsScreen
import com.otprelay.ui.screens.welcome.WelcomeScreen

sealed class Screen(val route: String) {
    object Welcome : Screen("welcome")
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object Authorizations : Screen("authorizations")
    object Activity : Screen("activity")
    object Settings : Screen("settings")
}

@Composable
fun OTPRelayNavGraph(
    startDestination: String = Screen.Welcome.route,
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
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
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
