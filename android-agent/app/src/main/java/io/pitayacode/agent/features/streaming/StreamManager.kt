package io.pitayacode.agent.features.streaming

import android.content.Context
import android.content.Intent
import dagger.hilt.android.qualifiers.ApplicationContext
import io.pitayacode.agent.features.commands.data.CommandService
import io.pitayacode.agent.features.commands.data.IceCandidatePayload
import io.pitayacode.agent.features.commands.data.SessionDescriptionPayload
import io.pitayacode.agent.features.commands.data.WebSocketMessage
import org.webrtc.IceCandidate
import org.webrtc.SessionDescription
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StreamManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val commandService: CommandService
) : SignalingClient, CommandService.SignalingListener {

    private var webRTCClient: WebRTCClient? = null

    init {
        commandService.setSignalingListener(this)
    }

    fun startStreaming(resultCode: Int, data: Intent) {
        webRTCClient = WebRTCClient(context, this)
        webRTCClient?.startScreenCapture(data)
        webRTCClient?.createPeerConnection()
        webRTCClient?.createOffer()
    }

    override fun sendOffer(sessionDescription: SessionDescription) {
        val payload = SessionDescriptionPayload(type = "offer", sdp = sessionDescription.description)
        val message = WebSocketMessage(
            type = "OFFER",
            sdp = payload
        )
        commandService.sendMessage(message)
    }

    override fun sendAnswer(sessionDescription: SessionDescription) {
        val payload = SessionDescriptionPayload(type = "answer", sdp = sessionDescription.description)
        val message = WebSocketMessage(
            type = "ANSWER",
            sdp = payload
        )
        commandService.sendMessage(message)
    }

    override fun sendIceCandidate(iceCandidate: IceCandidate) {
        val payload = IceCandidatePayload(
            sdpMid = iceCandidate.sdpMid,
            sdpMLineIndex = iceCandidate.sdpMLineIndex,
            candidate = iceCandidate.sdp
        )
        val message = WebSocketMessage(
            type = "CANDIDATE",
            iceCandidate = payload
        )
        commandService.sendMessage(message)
    }

    override fun onOfferReceived(sdp: SessionDescriptionPayload) {
        // Agent usually initiates, but if we receive an offer, handles it here
        webRTCClient?.onRemoteSessionReceived(
            SessionDescription(
                SessionDescription.Type.OFFER,
                sdp.sdp
            )
        )
    }

    override fun onAnswerReceived(sdp: SessionDescriptionPayload) {
        webRTCClient?.onRemoteSessionReceived(
            SessionDescription(
                SessionDescription.Type.ANSWER,
                sdp.sdp
            )
        )
    }

    override fun onIceCandidateReceived(candidate: IceCandidatePayload) {
        webRTCClient?.onIceCandidateReceived(
            IceCandidate(
                candidate.sdpMid,
                candidate.sdpMLineIndex,
                candidate.candidate
            )
        )
    }
}
