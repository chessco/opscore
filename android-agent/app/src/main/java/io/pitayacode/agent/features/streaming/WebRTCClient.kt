package io.pitayacode.agent.features.streaming

import android.content.Context
import android.util.Log
import android.media.projection.MediaProjection
import org.webrtc.*

class WebRTCClient(
    private val context: Context,
    private val signalingClient: SignalingClient
) {

    private val rootEglBase: EglBase = EglBase.create()
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoCapturer: VideoCapturer? = null
    private var localVideoTrack: VideoTrack? = null
    private var localVideoSource: VideoSource? = null

    init {
        initPeerConnectionFactory()
    }

    private fun initPeerConnectionFactory() {
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(rootEglBase.eglBaseContext, true, false))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(rootEglBase.eglBaseContext))
            .createPeerConnectionFactory()

        // Force AudioManager back to NORMAL mode because WebRTC changes it to IN_COMMUNICATION
        // which mutes the device's physical speaker.
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        audioManager.mode = android.media.AudioManager.MODE_NORMAL
        audioManager.isSpeakerphoneOn = true
    }

    fun startScreenCapture(permissionIntent: android.content.Intent) {
        videoCapturer = ScreenCapturerAndroid(permissionIntent, object : MediaProjection.Callback() {
            override fun onStop() {
                Log.e("WebRTCClient", "MediaProjection stopped")
            }
        })

        localVideoSource = peerConnectionFactory?.createVideoSource(videoCapturer!!.isScreencast)
        videoCapturer?.initialize(SurfaceTextureHelper.create("CaptureThread", rootEglBase.eglBaseContext), context, localVideoSource!!.capturerObserver)
        
        // High Quality for Remote Control (720p @ 30fps)
        videoCapturer?.startCapture(1280, 720, 30)

        localVideoTrack = peerConnectionFactory?.createVideoTrack("100", localVideoSource)
    }

    fun createPeerConnection() {
        val rtcConfig = PeerConnection.RTCConfiguration(
            listOf(PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer())
        )
        
        peerConnection = peerConnectionFactory?.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                signalingClient.sendIceCandidate(candidate)
            }
            override fun onIceCandidatesRemoved(p0: Array<out IceCandidate?>?) {
                TODO("Not yet implemented")
            }
            override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState) {
                Log.d("WebRTCClient", "IceConnectionState: $newState")
            }
            // Implement other members as needed
            override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
            override fun onIceConnectionReceivingChange(p0: Boolean) {}
            override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
            override fun onAddStream(p0: MediaStream?) {}
            override fun onRemoveStream(p0: MediaStream?) {}
            override fun onDataChannel(p0: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        })

        peerConnection?.addTrack(localVideoTrack, listOf("streamId"))
    }

    fun createOffer() {
        peerConnection?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription) {
                peerConnection?.setLocalDescription(this, desc)
                signalingClient.sendOffer(desc)
            }
            override fun onSetSuccess() {}
            override fun onCreateFailure(p0: String?) {}
            override fun onSetFailure(p0: String?) {}
        }, MediaConstraints())
    }
    
    fun onRemoteSessionReceived(sessionDescription: SessionDescription) {
        peerConnection?.setRemoteDescription(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription) {}
            override fun onSetSuccess() {
                if (sessionDescription.type == SessionDescription.Type.OFFER) {
                    createAnswer()
                }
            }
            override fun onCreateFailure(p0: String?) {}
            override fun onSetFailure(p0: String?) {
                Log.e("WebRTCClient", "Set Remote Description Failure: $p0")
            }
        }, sessionDescription)
    }

    private fun createAnswer() {
        peerConnection?.createAnswer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription) {
                peerConnection?.setLocalDescription(this, desc)
                signalingClient.sendAnswer(desc)
            }
            override fun onSetSuccess() {}
            override fun onCreateFailure(p0: String?) {}
            override fun onSetFailure(p0: String?) {}
        }, MediaConstraints())
    }

    fun onIceCandidateReceived(iceCandidate: IceCandidate) {
        peerConnection?.addIceCandidate(iceCandidate)
    }

    fun close() {
        try {
            videoCapturer?.stopCapture()
            videoCapturer?.dispose()
            localVideoSource?.dispose()
            peerConnection?.close()
            peerConnectionFactory?.dispose()
            rootEglBase.release()
        } catch (e: Exception) {
            Log.e("WebRTCClient", "Error closing WebRTC client", e)
        }
    }
}

interface SignalingClient {
    fun sendOffer(sessionDescription: SessionDescription)
    fun sendAnswer(sessionDescription: SessionDescription)
    fun sendIceCandidate(iceCandidate: IceCandidate)
}
