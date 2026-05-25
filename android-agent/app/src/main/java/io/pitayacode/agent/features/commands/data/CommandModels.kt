package io.pitayacode.agent.features.commands.data

import com.google.gson.annotations.SerializedName

data class WebSocketMessage(
    val type: String, // "COMMAND", "ACK", "OFFER", "ANSWER", "CANDIDATE"
    val commandId: String? = null,
    val correlationId: String? = null,
    val tenantId: String? = null,
    val deviceId: String? = null,
    val command: CommandPayload? = null,
    val status: String? = null, // For ACK
    val outcome: CommandOutcome? = null, // For ACK
    val sdp: SessionDescriptionPayload? = null, // For WebRTC
    val iceCandidate: IceCandidatePayload? = null, // For WebRTC
    val input: InputPayload? = null,
    val phoneNumber: String? = null, // For DIAL command
    val interactionId: String? = null // For DIAL command
)

data class SessionDescriptionPayload(
    val type: String, // "offer", "answer"
    val sdp: String
)

data class IceCandidatePayload(
    val sdpMid: String,
    val sdpMLineIndex: Int,
    val candidate: String
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
    SET_MAX_BITRATE,
    SET_FPS
}

data class InputPayload(
    val type: String, // "TOUCH", "KEY", "SCROLL"
    val action: String, // "DOWN", "MOVE", "UP", "CLICK" or "BACK", "HOME", "RECENT"
    val x: Float? = null, // Normalized 0..1
    val y: Float? = null, // Normalized 0..1
    val keycode: Int? = null,
    val text: String? = null
)
