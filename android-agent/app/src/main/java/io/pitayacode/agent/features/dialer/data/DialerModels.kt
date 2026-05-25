package io.pitayacode.agent.features.dialer.data

import com.google.gson.annotations.SerializedName

// --- Lead ---
data class LeadResponse(
    val id: String,
    val phone: String,
    val name: String,
    val status: String,
    val campaignId: String,
    val metadata: Map<String, Any>? = null
)

// --- Dialer Dial Response ---
data class DialResponse(
    val interaction: InteractionResponse,
    val deviceAssociated: String?,
    val websocketDispatched: Boolean
)

// --- Interaction ---
data class InteractionResponse(
    val id: String,
    val leadId: String,
    val campaignId: String,
    val surveyId: String?,
    val status: String,
    val lead: LeadResponse? = null,
    val campaign: CampaignResponse? = null,
    val survey: SurveyResponse? = null
)

// --- Campaign ---
data class CampaignResponse(
    val id: String,
    val surveyType: String,
    val externalSurveyUrl: String?
)

// --- Survey ---
data class SurveyResponse(
    val id: String,
    val title: String,
    val isActive: Boolean,
    val campaignId: String,
    val schema: SurveySchema
)

data class SurveySchema(
    val steps: List<SurveyStep>
)

data class SurveyStep(
    val id: String,
    val type: String,   // "link" | "text" | "radio" | "checkbox" | "number"
    val question: String,
    val url: String? = null,           // if type == "link"
    val options: List<String>? = null  // if type == "radio" | "checkbox"
)

// --- Status Update Body ---
data class UpdateStatusBody(
    val status: String
)

// --- Survey Response Body ---
data class SurveyResponseBody(
    val response: Map<String, Any>
)
