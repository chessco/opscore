import { socketService } from './socketService';

export class StreamManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private streams: Map<string, MediaStream> = new Map();

    // Listeners for stream events
    private listeners: Set<(deviceId: string, stream: MediaStream) => void> = new Set();

    public subscribe(callback: (deviceId: string, stream: MediaStream) => void) {
        this.listeners.add(callback);
        // Immediately notify of existing streams? 
        // Better to let the component pull via getStream first, then listen for updates.
        // Or we can emit for existing streams.
        this.streams.forEach((stream, id) => callback(id, stream));
    }

    public unsubscribe(callback: (deviceId: string, stream: MediaStream) => void) {
        this.listeners.delete(callback);
    }

    constructor() {
        console.log('StreamManager initializing...');
        this.setupSocketListeners();
        socketService.connect();
    }

    private setupSocketListeners() {
        socketService.on('OFFER', async (msg) => {
            console.log('StreamManager received OFFER from:', msg.deviceId);
            const deviceId = msg.deviceId || 'unknown-device'; // Fallback
            if (msg.sdp) {
                await this.handleOffer(deviceId, msg.sdp.sdp);
            }
        });

        socketService.on('CANDIDATE', async (msg) => {
            // console.log('StreamManager received CANDIDATE from:', msg.deviceId);
            const deviceId = msg.deviceId || 'unknown-device';
            if (msg.iceCandidate) {
                await this.handleCandidate(deviceId, msg.iceCandidate);
            }
        });
    }

    private async handleOffer(deviceId: string, sdp: string) {
        // If PC exists, precise cleanup might be needed, but for now we replace/reuse
        if (this.peerConnections.has(deviceId)) {
            console.warn(`Replacing existing PC for ${deviceId}`);
            this.peerConnections.get(deviceId)?.close();
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.peerConnections.set(deviceId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.send({
                    type: 'CANDIDATE',
                    deviceId: deviceId, // Target device
                    iceCandidate: {
                        sdpMid: event.candidate.sdpMid || '',
                        sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
                        candidate: event.candidate.candidate
                    }
                });
            }
        };

        this.monitorConnection(pc, deviceId);

        pc.ontrack = (event) => {
            console.log(`Track received for ${deviceId}:`, event.streams[0]);
            this.streams.set(deviceId, event.streams[0]);
            this.listeners.forEach(listener => listener(deviceId, event.streams[0]));
        };

        try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketService.send({
                type: 'ANSWER',
                deviceId: deviceId,
                sdp: { type: 'answer', sdp: answer.sdp || '' }
            });
            console.log(`Sent ANSWER to ${deviceId}`);

        } catch (e) {
            console.error('Error handling offer:', e);
        }
    }

    private async handleCandidate(deviceId: string, candidate: any) {
        const pc = this.peerConnections.get(deviceId);
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate({
                    candidate: candidate.candidate,
                    sdpMid: candidate.sdpMid,
                    sdpMLineIndex: candidate.sdpMLineIndex
                }));
            } catch (e) {
                console.error('Error adding candidate:', e);
            }
        }
    }

    getStream(deviceId: string): MediaStream | undefined {
        return this.streams.get(deviceId);
    }

    private monitorConnection(pc: RTCPeerConnection, deviceId: string) {
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE Connection State (${deviceId}):`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                console.warn(`Connection to ${deviceId} lost. Cleaning up...`);
                // Optional: Trigger UI to show "Reconnecting..."
                // this.streams.delete(deviceId);
                // if (this.onStreamRemoved) this.onStreamRemoved(deviceId);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection State (${deviceId}):`, pc.connectionState);
        };
    }
}

export const streamManager = new StreamManager();
