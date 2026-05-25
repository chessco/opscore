package io.pitayacode.agent.features.dialer.data

import retrofit2.Response
import retrofit2.http.*

interface DialerApiService {

    @GET("/dialer/next/{campaignId}")
    suspend fun getNextLead(
        @Path("campaignId") campaignId: String,
        @Header("Authorization") authHeader: String
    ): Response<LeadResponse>

    @POST("/dialer/dial/{leadId}")
    suspend fun dialLead(
        @Path("leadId") leadId: String,
        @Header("Authorization") authHeader: String
    ): Response<DialResponse>

    @PATCH("/interactions/{id}/status")
    suspend fun updateInteractionStatus(
        @Path("id") interactionId: String,
        @Header("Authorization") authHeader: String,
        @Body body: UpdateStatusBody
    ): Response<InteractionResponse>

    @GET("/surveys/campaign/{campaignId}")
    suspend fun getSurveysForCampaign(
        @Path("campaignId") campaignId: String,
        @Header("Authorization") authHeader: String
    ): Response<List<SurveyResponse>>

    @POST("/interactions/{id}/response")
    suspend fun submitSurveyResponse(
        @Path("id") interactionId: String,
        @Header("Authorization") authHeader: String,
        @Body body: SurveyResponseBody
    ): Response<InteractionResponse>
}
