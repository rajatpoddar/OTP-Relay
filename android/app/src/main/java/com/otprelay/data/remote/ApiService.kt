package com.otprelay.data.remote

import com.otprelay.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<LoginResponse>

    @GET("api/auth/me")
    suspend fun getCurrentUser(): Response<UserInfo>

    // App OTP Login
    @POST("api/auth/app/request-otp")
    suspend fun appRequestOtp(@Body request: AppRequestOTP): Response<AppRequestOTPResponse>

    @POST("api/auth/app/verify-otp")
    suspend fun appVerifyOtp(@Body request: AppVerifyOTP): Response<AppLoginResponse>

    @POST("api/auth/app/onboard")
    suspend fun appOnboard(@Body request: AppOnboard): Response<Map<String, Any>>

    // Device
    @POST("api/device/register-staff")
    suspend fun registerDeviceForStaff(@Body request: DeviceRegisterRequest): Response<DeviceResponse>

    @POST("api/device/register")
    suspend fun registerDevice(@Body request: DeviceRegisterRequest): Response<DeviceResponse>

    @POST("api/device/heartbeat")
    suspend fun sendHeartbeat(@Body request: HeartbeatRequest): Response<HeartbeatResponse>

    @POST("api/device/sync")
    suspend fun syncOtps(@Body request: SyncRequest): Response<SyncResponse>

    @GET("api/device/status/{deviceId}")
    suspend fun getDeviceStatus(@Path("deviceId") deviceId: String): Response<DeviceResponse>

    // OTP
    @POST("api/otp/submit")
    suspend fun submitOtp(@Body request: OtpSubmitRequest): Response<OtpResponse>

    @GET("api/otp/history")
    suspend fun getOtpHistory(
        @Query("limit") limit: Int = 50,
        @Query("skip") skip: Int = 0
    ): Response<List<OtpResponse>>

    // Staff Authorizations
    @POST("api/staff/authorize-by-text")
    suspend fun authorizeSender(@Body request: AuthorizeRequest): Response<AuthorizeResponse>

    @GET("api/staff/authorizations")
    suspend fun getAuthorizations(): Response<List<AuthorizeResponse>>

    @GET("api/staff/my-senders")
    suspend fun getMySenders(): Response<List<MySenderResponse>>

    // Sender IDs
    @GET("api/admin/sender-ids")
    suspend fun getSenderIds(): Response<List<SenderIdResponse>>

    // App Version
    @GET("api/super-admin/app-versions")
    suspend fun getAppVersions(): Response<List<AppVersionResponse>>

    // Public update check (no auth required)
    @GET("api/public/app-version/latest")
    suspend fun getLatestVersion(): Response<LatestVersionResponse>
}
