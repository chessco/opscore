package io.pitayacode.agent.features.commands.data

import android.util.Log
import com.google.gson.Gson
import io.pitayacode.agent.core.network.NetworkModule
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

@Singleton
class CommandService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson
) {

    private var webSocket: WebSocket? = null
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    // Listener for WebRTC Signaling
    private var signalingListener: SignalingListener? = null

    interface SignalingListener {
        fun onOfferReceived(sdp: SessionDescriptionPayload)
        fun onAnswerReceived(sdp: SessionDescriptionPayload)
        fun onIceCandidateReceived(candidate: IceCandidatePayload)
    }

    fun setSignalingListener(listener: SignalingListener) {
        this.signalingListener = listener
    }

    fun connect(url: String, token: String) {
        if (webSocket != null) return

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $token")
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i("CommandService", "WebSocket Connected")
                _isConnected.value = true
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("CommandService", "Received: $text")
                try {
                    val message = gson.fromJson(text, WebSocketMessage::class.java)
                    when (message.type) {
                        "COMMAND" -> {
                            if (message.command != null) {
                                // TODO: Process Command via CommandHandler
                                sendAck(message.commandId ?: "", "RECEIVED", true, "OK")
                            }
                        }
                        "OFFER" -> {
                            message.sdp?.let { signalingListener?.onOfferReceived(it) }
                        }
                        "ANSWER" -> {
                            message.sdp?.let { signalingListener?.onAnswerReceived(it) }
                        }
                        "CANDIDATE" -> {
                            message.iceCandidate?.let { signalingListener?.onIceCandidateReceived(it) }
                        }
                        "INPUT" -> {
                            message.input?.let { input ->
                                when (input.type) {
                                    "TOUCH" -> {
                                        if (input.x != null && input.y != null) {
                                            val metrics = io.pitayacode.agent.features.input.RemoteControlService.instance?.resources?.displayMetrics
                                            if (metrics != null) {
                                                val realX = input.x * metrics.widthPixels
                                                val realY = input.y * metrics.heightPixels
                                                io.pitayacode.agent.features.input.RemoteControlService.instance?.injectTouch(realX, realY, input.action)
                                            } else {
                                                Unit
                                            }
                                        }
                                        Unit
                                    }
                                    "KEY" -> {
                                        io.pitayacode.agent.features.input.RemoteControlService.instance?.injectKey(input.action)
                                    }
                                    else -> {
                                        Log.w("CommandService", "Unknown input type: ${input.type}")
                                    }
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("CommandService", "Error parsing message", e)
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.i("CommandService", "WebSocket Closing: $reason")
                _isConnected.value = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("CommandService", "WebSocket Failure", t)
                _isConnected.value = false
                this@CommandService.webSocket = null
                // TODO: Trigger reconnection logic
            }
        })
    }

    fun sendMessage(message: WebSocketMessage) {
        val json = gson.toJson(message)
        webSocket?.send(json)
    }

    fun sendAck(commandId: String, status: String, success: Boolean, reasonCode: String) {
        val ack = WebSocketMessage(
            type = "ACK",
            commandId = commandId,
            status = status,
            outcome = CommandOutcome(success, reasonCode)
        )
        sendMessage(ack)
    }

    fun disconnect() {
        webSocket?.close(1000, "Disconnecting")
        webSocket = null
        _isConnected.value = false
    }
}
