package io.pitayacode.agent.features.commands.data

import com.google.gson.annotations.SerializedName

data class WebSocketMessage(
    val type: String, // "COMMAND" or "ACK"
    val commandId: String? = null,
    val correlationId: String? = null,
    val tenantId: String? = null,
    val deviceId: String? = null,
    val command: CommandPayload? = null,
    val status: String? = null, // For ACK
    val outcome: CommandOutcome? = null // For ACK
)

data class CommandPayload(
    val name: String, // "NAVIGATE", "STOP_ALL", etc.
    val version: String,
    val params: Map<String, Any>?
)

data class CommandOutcome(
    val success: Boolean,
    val reasonCode: String,
    val details: Map<String, Any>? = null
)

enum class CommandType {
    NAVIGATE,
    SET_FIELD,
    SUBMIT,
    QUERY_STATE,
    REFRESH_APP,
    STOP_ALL,
    ENTER_SAFE_MODE,
    EXIT_SAFE_MODE,
    SET_STREAM_MODE,
    SET_MAX_BITRATE,
    SET_FPS
}
