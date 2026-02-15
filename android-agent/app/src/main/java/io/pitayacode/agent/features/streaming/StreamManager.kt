package io.pitayacode.agent.features.streaming

import android.content.Context
import android.content.Intent
import dagger.hilt.android.qualifiers.ApplicationContext
import org.webrtc.IceCandidate
import org.webrtc.SessionDescription
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StreamManager @Inject constructor(
    @ApplicationContext private val context: Context
) : SignalingClient {

    private var webRTCClient: WebRTCClient? = null

    fun startStreaming(resultCode: Int, data: Intent) {
        webRTCClient = WebRTCClient(context, this)
        webRTCClient?.startScreenCapture(data)
        webRTCClient?.createPeerConnection()
        webRTCClient?.createOffer()
    }

    override fun sendOffer(sessionDescription: SessionDescription) {
        // TODO: Use CommandService to send OFFER message via WebSocket
    }

    override fun sendAnswer(sessionDescription: SessionDescription) {
        // TODO: Use CommandService to send ANSWER message via WebSocket
    }

    override fun sendIceCandidate(iceCandidate: IceCandidate) {
        // TODO: Use CommandService to send CANDIDATE message via WebSocket
    }
}
