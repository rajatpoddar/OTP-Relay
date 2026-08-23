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

// Primary - Navy (same as web)
private val Primary = Color(0xFF0F172A)
private val OnPrimary = Color(0xFFFFFFFF)
private val PrimaryContainer = Color(0xFFE8EAF6)
private val OnPrimaryContainer = Color(0xFF0F172A)

// Secondary - Indigo (same as web)
private val Secondary = Color(0xFF4648D4)
private val OnSecondary = Color(0xFFFFFFFF)
private val SecondaryContainer = Color(0xFFE8E9FD)
private val OnSecondaryContainer = Color(0xFF4648D4)

// Surface & Background
private val Surface = Color(0xFFF8FAFC)
private val OnSurface = Color(0xFF0F172A)
private val OnSurfaceVariant = Color(0xFF475569)

// Outline
private val Outline = Color(0xFF94A3B8)
private val OutlineVariant = Color(0xFFE2E8F0)

// Error
private val Error = Color(0xFFDC2626)
private val ErrorContainer = Color(0xFFFEE2E2)
private val OnError = Color(0xFFFFFFFF)

// Tertiary - Green for success states
private val Tertiary = Color(0xFF16A34A)
private val TertiaryContainer = Color(0xFFDCFCE7)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = OnSecondaryContainer,
    surface = Surface,
    onSurface = OnSurface,
    onSurfaceVariant = OnSurfaceVariant,
    outline = Outline,
    outlineVariant = OutlineVariant,
    error = Error,
    errorContainer = ErrorContainer,
    onError = OnError,
    tertiary = Tertiary,
    tertiaryContainer = TertiaryContainer,
)

@Composable
fun OTPRelayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            try {
                val window = (view.context as? Activity)?.window
                if (window != null) {
                    window.statusBarColor = Primary.toArgb()
                    WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
                }
            } catch (_: Exception) {
                // Ignore if Activity not available
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
