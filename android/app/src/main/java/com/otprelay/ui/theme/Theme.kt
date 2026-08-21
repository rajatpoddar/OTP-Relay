package com.otprelay.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Colors matching the Stitch design system
private val Primary = Color(0xFF0F172A)
private val OnPrimary = Color(0xFFFFFFFF)
private val PrimaryContainer = Color(0xFF131B2E)
private val Secondary = Color(0xFF4648D4)
private val SecondaryContainer = Color(0xFF6063EE)
private val Surface = Color(0xFFF8F9FF)
private val SurfaceContainerLowest = Color(0xFFFFFFFF)
private val SurfaceContainerLow = Color(0xFFEFF4FF)
private val SurfaceContainer = Color(0xFFE5EEFF)
private val OnSurface = Color(0xFF0B1C30)
private val OnSurfaceVariant = Color(0xFF45464D)
private val Outline = Color(0xFF76777D)
private val OutlineVariant = Color(0xFFC6C6CD)
private val Error = Color(0xFFBA1A1A)
private val ErrorContainer = Color(0xFFFFDAD6)
private val TertiaryFixedDim = Color(0xFF4EDEA3)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    secondary = Secondary,
    secondaryContainer = SecondaryContainer,
    surface = Surface,
    surfaceContainerLowest = SurfaceContainerLowest,
    surfaceContainerLow = SurfaceContainerLow,
    surfaceContainer = SurfaceContainer,
    onSurface = OnSurface,
    onSurfaceVariant = OnSurfaceVariant,
    outline = Outline,
    outlineVariant = OutlineVariant,
    error = Error,
    errorContainer = ErrorContainer,
)

@Composable
fun OTPRelayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme // Use light theme for government portal

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
