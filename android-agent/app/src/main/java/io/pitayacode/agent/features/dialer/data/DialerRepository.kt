package io.pitayacode.agent.features.dialer.data

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DialerRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val dialerApiService: DialerApiService
) {
    private val prefs = context.getSharedPreferences("agent_prefs", Context.MODE_PRIVATE)

    fun getAuthToken(): String = prefs.getString("auth_token", "") ?: ""
    fun getCampaignId(): String = prefs.getString("campaign_id", "") ?: ""
    fun getServerUrl(): String = prefs.getString("server_url", "https://opscore-api.pitayacode.io") ?: "https://opscore-api.pitayacode.io"

    fun saveConfig(serverUrl: String, authToken: String, campaignId: String) {
        prefs.edit()
            .putString("server_url", serverUrl)
            .putString("auth_token", authToken)
            .putString("campaign_id", campaignId)
            .apply()
    }

    suspend fun getNextLead(): Result<LeadResponse> {
        val campaignId = getCampaignId()
        val authHeader = "Bearer ${getAuthToken()}"
        return try {
            val response = dialerApiService.getNextLead(campaignId, authHeader)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Error ${response.code()}"
                Log.e("DialerRepository", "getNextLead failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e("DialerRepository", "getNextLead exception", e)
            Result.failure(e)
        }
    }

    suspend fun dialLead(leadId: String): Result<DialResponse> {
        val authHeader = "Bearer ${getAuthToken()}"
        return try {
            val response = dialerApiService.dialLead(leadId, authHeader)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Error ${response.code()}"
                Log.e("DialerRepository", "dialLead failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e("DialerRepository", "dialLead exception", e)
            Result.failure(e)
        }
    }

    suspend fun updateInteractionStatus(interactionId: String, status: String): Result<InteractionResponse> {
        val authHeader = "Bearer ${getAuthToken()}"
        return try {
            val response = dialerApiService.updateInteractionStatus(interactionId, authHeader, UpdateStatusBody(status))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Error ${response.code()}"
                Log.e("DialerRepository", "updateStatus failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e("DialerRepository", "updateStatus exception", e)
            Result.failure(e)
        }
    }

    suspend fun getSurveysForCampaign(): Result<List<SurveyResponse>> {
        val campaignId = getCampaignId()
        val authHeader = "Bearer ${getAuthToken()}"
        return try {
            val response = dialerApiService.getSurveysForCampaign(campaignId, authHeader)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Error ${response.code()}"
                Log.e("DialerRepository", "getSurveys failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e("DialerRepository", "getSurveys exception", e)
            Result.failure(e)
        }
    }

    suspend fun submitSurveyResponse(interactionId: String, responseData: Map<String, Any>): Result<InteractionResponse> {
        val authHeader = "Bearer ${getAuthToken()}"
        return try {
            val response = dialerApiService.submitSurveyResponse(interactionId, authHeader, SurveyResponseBody(responseData))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Error ${response.code()}"
                Log.e("DialerRepository", "submitResponse failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e("DialerRepository", "submitResponse exception", e)
            Result.failure(e)
        }
    }
}
