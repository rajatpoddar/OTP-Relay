package com.otprelay.data.local

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

// OTP Entity for local queue
@Entity(tableName = "pending_otps")
data class PendingOtp(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val senderId: String,
    val message: String,
    val otpValue: String?,
    val extractedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING", // PENDING, SYNCED, FAILED
    val syncAttempts: Int = 0,
    val lastSyncAttempt: Long? = null,
    val errorMessage: String? = null
)

// Authorized Sender Entity
@Entity(tableName = "authorized_senders")
data class AuthorizedSender(
    @PrimaryKey val senderId: String,
    val displayName: String?,
    val serviceCode: String?,
    val otpLength: Int = 6,
    val extractionRegex: String?,
    val isAuthorized: Boolean = true,
    val routedTo: String? = null,  // Comma-separated operator names
    val lastUpdated: Long = System.currentTimeMillis()
)

// DAO for Pending OTPs
@Dao
interface PendingOtpDao {
    @Query("SELECT * FROM pending_otps WHERE syncStatus = 'PENDING' ORDER BY extractedAt ASC")
    fun getPendingOtps(): Flow<List<PendingOtp>>

    @Query("SELECT * FROM pending_otps ORDER BY extractedAt DESC LIMIT :limit")
    fun getRecentOtps(limit: Int = 50): Flow<List<PendingOtp>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOtp(otp: PendingOtp): Long

    @Update
    suspend fun updateOtp(otp: PendingOtp)

    @Query("UPDATE pending_otps SET syncStatus = 'SYNCED' WHERE id = :id")
    suspend fun markSynced(id: Long)

    @Query("UPDATE pending_otps SET syncStatus = 'FAILED', errorMessage = :error, syncAttempts = syncAttempts + 1, lastSyncAttempt = :timestamp WHERE id = :id")
    suspend fun markFailed(id: Long, error: String, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM pending_otps WHERE syncStatus = 'SYNCED' AND extractedAt < :cutoff")
    suspend fun cleanupSynced(cutoff: Long)

    @Query("SELECT COUNT(*) FROM pending_otps WHERE syncStatus = 'PENDING'")
    suspend fun getPendingCount(): Int
}

// DAO for Authorized Senders
@Dao
interface AuthorizedSenderDao {
    @Query("SELECT * FROM authorized_senders WHERE isAuthorized = 1")
    fun getAuthorizedSenders(): Flow<List<AuthorizedSender>>

    @Query("SELECT * FROM authorized_senders")
    fun getAllSenders(): Flow<List<AuthorizedSender>>

    @Query("SELECT * FROM authorized_senders WHERE senderId = :senderId")
    suspend fun getSender(senderId: String): AuthorizedSender?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSender(sender: AuthorizedSender)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSenders(senders: List<AuthorizedSender>)

    @Query("UPDATE authorized_senders SET isAuthorized = :authorized WHERE senderId = :senderId")
    suspend fun updateAuthorization(senderId: String, authorized: Boolean)

    @Query("SELECT * FROM authorized_senders WHERE isAuthorized = 1")
    suspend fun getAllSendersSync(): List<AuthorizedSender>

    @Query("DELETE FROM authorized_senders")
    suspend fun deleteAll()
}

// Database
@Database(
    entities = [PendingOtp::class, AuthorizedSender::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun pendingOtpDao(): PendingOtpDao
    abstract fun authorizedSenderDao(): AuthorizedSenderDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "otp_relay_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
