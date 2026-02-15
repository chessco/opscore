package io.pitayacode.agent.features.enrollment.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class EnrollmentRequest(
    val deviceId: String,
    val tenantId: String,
    val csr: String
)

data class EnrollmentResponse(
    val certificateChain: List<String>
)

interface EnrollmentService {
    @POST("/device/enroll/finish")
    suspend fun enroll(@Body request: EnrollmentRequest): Response<EnrollmentResponse>
}
