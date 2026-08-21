package com.otprelay.data.remote

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val BASE_URL = "http://10.0.2.2:8000/" // Android emulator localhost

    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder().apply {
            authToken?.let { token ->
                addHeader("Authorization", "Bearer $token")
            }
        }.build()
        chain.proceed(request)
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    fun createApiService(): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
