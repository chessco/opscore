package io.pitayacode.agent.features.enrollment.domain

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import io.pitayacode.agent.core.security.KeyStoreManager
import io.pitayacode.agent.features.enrollment.data.EnrollmentRequest
import io.pitayacode.agent.features.enrollment.data.EnrollmentService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EnrollmentRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val keyStoreManager: KeyStoreManager,
    private val enrollmentService: EnrollmentService
) {

    private val prefs: SharedPreferences = context.getSharedPreferences("agent_prefs", Context.MODE_PRIVATE)

    fun isEnrolled(): Boolean {
        return prefs.getBoolean("is_enrolled", false)
    }

    suspend fun enroll(tenantId: String, deviceId: String): Result<Unit> {
        return try {
            // 1. Generate CSR
            val csr = keyStoreManager.generateCSR(tenantId, deviceId)
            
            // 2. Send to Backend
            val request = EnrollmentRequest(deviceId, tenantId, csr)
            val response = enrollmentService.enroll(request)

            if (response.isSuccessful && response.body() != null) {
                // 3. Store Certificate (TODO: Implement secure storage in KeyStore)
                // val certChain = response.body()!!.certificateChain
                // keyStoreManager.storeCertificate(certChain)
                
                prefs.edit().putBoolean("is_enrolled", true).apply()
                Result.success(Unit)
            } else {
                Result.failure(Exception("Enrollment failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("EnrollmentRepository", "Error enrolling", e)
            Result.failure(e)
        }
    }
}
