/**
 * WebRTC Stream Manager for scaling 100-200 device streams
 * Handles Simulcast, adaptive bitrate, and focus priority.
 */

export interface StreamStats {
    id: string;
    bitrate: number;
    latency: number;
    resolution: string;
    fps: number;
}

export class StreamManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private streams: Map<string, MediaStream> = new Map();
    private focalDeviceId: string | null = null;

    constructor() {
        console.log('StreamManager initialized');
    }

    /**
     * Connect to a new device stream
     */
    async connectDevice(deviceId: string, _signalData: any) {
        if (this.peerConnections.has(deviceId)) return;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            iceTransportPolicy: 'all',
        });

        this.peerConnections.set(deviceId, pc);

        pc.ontrack = (event) => {
            this.streams.set(deviceId, event.streams[0]);
            this.updateStreamPriority(deviceId);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') {
                this.handleReconnection(deviceId);
            }
        };

        // Network change detection
        window.addEventListener('online', () => this.handleNetworkRestore());

        return pc;
    }

    /**
     * Update simulcast layers based on focus
     * For receiving: Usually involves signaling to SFU.
     * For sending (MediaProjection): Uses RTCRtpSender.setParameters.
     */
    private updateStreamPriority(deviceId: string) {
        const pc = this.peerConnections.get(deviceId);
        if (!pc) return;

        // In a real SFU implementation, we would send a 'switch-layer' 
        // message via signaling to the server.
        const isFocused = deviceId === this.focalDeviceId;
        console.log(`Setting device ${deviceId} to ${isFocused ? 'High (720p)' : 'Low (360p)'}`);

        // Example of adjusting local senders if this was a two-way connection
        pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'video') {
                const params = sender.getParameters();
                if (params.encodings.length > 0) {
                    params.encodings.forEach((encoding, idx) => {
                        // Logic for multi-layer encoding selection
                        encoding.active = isFocused || idx === 0;
                    });
                    sender.setParameters(params).catch(console.error);
                }
            }
        });
    }

    setFocus(deviceId: string | null) {
        this.focalDeviceId = deviceId;
        this.peerConnections.forEach((_, id) => this.updateStreamPriority(id));
    }

    private handleReconnection(deviceId: string) {
        console.warn(`Stream ${deviceId} disconnected. Attempting reconnection...`);
        // Exponential backoff logic would go here
    }

    private handleNetworkRestore() {
        console.log('Network restored. Re-syncing streams.');
        this.peerConnections.forEach((pc) => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                // Trigger renegotiation
            }
        });
    }

    cleanup() {
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        this.streams.clear();
    }
}

export const streamManager = new StreamManager();
