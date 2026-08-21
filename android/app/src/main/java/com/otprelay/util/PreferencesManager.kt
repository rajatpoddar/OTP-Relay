package com.otprelay.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "otp_relay_prefs")

class PreferencesManager(private val context: Context) {

    companion object {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_ROLE = stringPreferencesKey("user_role")
        val ORGANIZATION_ID = stringPreferencesKey("organization_id")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val IS_ACTIVATED = booleanPreferencesKey("is_activated")
        val CONSENT_GIVEN = booleanPreferencesKey("consent_given")
    }

    val accessToken: Flow<String?> = context.dataStore.data.map { it[ACCESS_TOKEN] }
    val refreshToken: Flow<String?> = context.dataStore.data.map { it[REFRESH_TOKEN] }
    val userId: Flow<String?> = context.dataStore.data.map { it[USER_ID] }
    val userName: Flow<String?> = context.dataStore.data.map { it[USER_NAME] }
    val userRole: Flow<String?> = context.dataStore.data.map { it[USER_ROLE] }
    val organizationId: Flow<String?> = context.dataStore.data.map { it[ORGANIZATION_ID] }
    val isActivated: Flow<Boolean> = context.dataStore.data.map { it[IS_ACTIVATED] ?: false }
    val consentGiven: Flow<Boolean> = context.dataStore.data.map { it[CONSENT_GIVEN] ?: false }

    suspend fun saveAuthTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun saveUserInfo(id: String, email: String, name: String, role: String, orgId: String?) {
        context.dataStore.edit { prefs ->
            prefs[USER_ID] = id
            prefs[USER_EMAIL] = email
            prefs[USER_NAME] = name
            prefs[USER_ROLE] = role
            orgId?.let { prefs[ORGANIZATION_ID] = it }
        }
    }

    suspend fun saveDeviceId(deviceId: String) {
        context.dataStore.edit { prefs ->
            prefs[DEVICE_ID] = deviceId
        }
    }

    suspend fun setActivated(activated: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[IS_ACTIVATED] = activated
        }
    }

    suspend fun setConsentGiven(given: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[CONSENT_GIVEN] = given
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
