package com.otprelay.data.model// Auth
data class LoginRequest(val email: String, val password: String)

data class LoginResponse(
    val access_token: String,
    val refresh_token: String,
    val token_type: String,
    val user: UserInfo
)

data class RefreshRequest(val refresh_token: String)
data class UserInfo(
    val id: String,
    val email: String,
    val full_name: String,
    val role: String,
    val organization_id: String?,
    val is_active: Boolean
)

// App OTP Login
data class AppRequestOTP(val mobile_number: String)

data class AppRequestOTPResponse(
    val message: String?,
    val expires_in_minutes: Int?
)

data class AppVerifyOTP(val mobile_number: String, val otp: String)

data class AppLoginResponse(
    val access_token: String,
    val refresh_token: String,
    val token_type: String,
    val user: UserInfo,
    val is_new_user: Boolean = false,
    val profile_completed: Boolean = true
)

data class AppOnboard(
    val name: String,
    val designation: String? = null,
    val department_id: String? = null,
    val sender_ids: List<String>? = null
)

// Device
data class DeviceRegisterRequest(
    val device_id: String,
    val activation_code: String,
    val model: String?,
    val android_version: String?,
    val app_version: String?
)

data class DeviceResponse(
    val id: String,
    val device_id: String,
    val staff_id: String,
    val organization_id: String,
    val model: String?,
    val android_version: String?,
    val app_version: String?,
    val status: String,
    val registered_at: String,
    val last_seen_at: String?,
    val last_sync_at: String?
)

data class HeartbeatRequest(val device_id: String)

data class HeartbeatResponse(val status: String, val last_seen: String)

data class SyncRequest(
    val device_id: String,
    val otp_events: List<OtpEvent>
)

data class OtpEvent(
    val sender_id: String,
    val message: String,
    val timestamp: String
)

data class SyncResponse(
    val status: String,
    val processed: Int,
    val total: Int
)

// OTP
data class OtpSubmitRequest(
    val sender_id_text: String,
    val message: String,
    val staff_id: String?
)

data class OtpResponse(
    val id: String,
    val organization_id: String,
    val staff_id: String,
    val sender_text: String,
    val service_name: String?,
    val otp_display: String?,
    val otp_length: Int?,
    val purpose: String?,
    val reference_number: String?,
    val status: String,
    val expiry_at: String?,
    val received_at: String
)

// Authorizations
data class AuthorizeRequest(
    val sender_text: String,
    val status: String = "AUTHORIZED"
)

data class AuthorizeResponse(
    val id: String,
    val staff_id: String,
    val sender_id: String,
    val status: String,
    val authorized_at: String?,
    val revoked_at: String?,
    val created_at: String
)

// Available Senders (for onboarding selection)
data class AvailableSenderResponse(
    val sender_id: String,
    val display_name: String?,
    val otp_length: Int
)

// My Authorized Senders (staff-specific)
data class MySenderResponse(
    val sender_id: String,
    val display_name: String?,
    val otp_length: Int,
    val extraction_regex: String?,
    val message_template: String?,
    val purpose_regex: String?,
    val reference_regex: String?,
    val is_authorized: Boolean,
    val routed_to: List<String>? = null
)

// Sender IDs
data class SenderIdResponse(
    val id: String,
    val organization_id: String,
    val department_id: String?,
    val sender_id: String,
    val display_name: String?,
    val otp_length: Int,
    val is_active: Boolean,
    val created_at: String
)

// App Version
data class AppVersionResponse(
    val id: String,
    val version: String,
    val minimum_supported_version: String?,
    val latest_version: String,
    val force_update: Boolean,
    val release_notes: String?,
    val download_url: String?,
    val is_active: Boolean,
    val created_at: String?
)

// Public version check response (no auth required)
data class LatestVersionResponse(
    val version: String,
    val force_update: Boolean,
    val release_notes: String?,
    val download_url: String?,
    val minimum_supported_version: String?,
    val is_update_available: Boolean
)
