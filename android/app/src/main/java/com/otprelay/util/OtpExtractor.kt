package com.otprelay.util

import com.otprelay.data.local.AuthorizedSender
import java.util.regex.Pattern

object OtpExtractor {

    data class ExtractedOtp(
        val otpValue: String?,
        val senderId: String?,
        val purpose: String?,
        val reference: String?,
        val serviceName: String?
    )

    // Default OTP extraction patterns
    private val defaultOtpPatterns = listOf(
        Pattern.compile("(?:OTP|otp|Otp)[:\\s]*(\\d{4,8})"),
        Pattern.compile("(?:code|Code)[:\\s]*(\\d{4,8})"),
        Pattern.compile("(?:verification|Verification)[:\\s]*(\\d{4,8})"),
        Pattern.compile("(?:is|Is)[:\\s]*(\\d{4,8})\\."),
        Pattern.compile("\\b(\\d{4,8})\\b")
    )

    // Default purpose extraction pattern
    private val defaultPurposePattern = Pattern.compile(
        "(?:for|For)\\s+(.+?)(?:\\s+for|\\s+is|\\.|\\s+Do\\s+not)",
        Pattern.CASE_INSENSITIVE
    )

    // Default reference extraction pattern
    private val defaultReferencePattern = Pattern.compile(
        "(?:Reference|reference|Ref|ref)\\s+(?:No\\.?|number)?\\s*[:\\s]*(\\S+)",
        Pattern.CASE_INSENSITIVE
    )

    /**
     * Extract OTP from SMS message using sender-specific or default patterns
     */
    fun extractOtp(message: String, sender: AuthorizedSender? = null): ExtractedOtp {
        val otpValue = extractOtpValue(message, sender)
        val purpose = extractPurpose(message, sender)
        val reference = extractReference(message, sender)

        return ExtractedOtp(
            otpValue = otpValue,
            senderId = sender?.senderId,
            purpose = purpose,
            reference = reference,
            serviceName = sender?.serviceCode
        )
    }

    /**
     * Extract OTP value from message
     */
    private fun extractOtpValue(message: String, sender: AuthorizedSender?): String? {
        // Try sender-specific regex first
        sender?.extractionRegex?.let { regex ->
            try {
                val pattern = Pattern.compile(regex)
                val matcher = pattern.matcher(message)
                if (matcher.find()) {
                    return matcher.group(1) ?: matcher.group(0)
                }
            } catch (e: Exception) {
                // Invalid regex, fall through to default
            }
        }

        // Try default patterns
        for (pattern in defaultOtpPatterns) {
            val matcher = pattern.matcher(message)
            if (matcher.find()) {
                return matcher.group(1)
            }
        }

        return null
    }

    /**
     * Extract purpose from message
     */
    private fun extractPurpose(message: String, sender: AuthorizedSender?): String? {
        val matcher = defaultPurposePattern.matcher(message)
        return if (matcher.find()) {
            matcher.group(1)?.trim()
        } else {
            null
        }
    }

    /**
     * Extract reference number from message
     */
    private fun extractReference(message: String, sender: AuthorizedSender?): String? {
        val matcher = defaultReferencePattern.matcher(message)
        return if (matcher.find()) {
            matcher.group(1)
        } else {
            null
        }
    }

    /**
     * Check if sender is authorized
     */
    fun isAuthorizedSender(senderId: String, authorizedSenders: List<AuthorizedSender>): Boolean {
        return authorizedSenders.any {
            it.senderId.equals(senderId, ignoreCase = true) && it.isAuthorized
        }
    }

    /**
     * Find matching authorized sender
     */
    fun findAuthorizedSender(senderId: String, authorizedSenders: List<AuthorizedSender>): AuthorizedSender? {
        return authorizedSenders.find {
            it.senderId.equals(senderId, ignoreCase = true) && it.isAuthorized
        }
    }

    /**
     * Validate OTP length
     */
    fun validateOtpLength(otp: String, expectedLength: Int): Boolean {
        return otp.length == expectedLength
    }

    /**
     * Mask OTP for display (used/expired)
     */
    fun maskOtp(otp: String?): String {
        if (otp == null || otp.length < 4) return "••••••"
        return "${otp.take(2)}••${otp.takeLast(2)}"
    }
}
