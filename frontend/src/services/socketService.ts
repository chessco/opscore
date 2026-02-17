import { useAuthStore } from '../store/authStore';

type MessageType = 'OFFER' | 'ANSWER' | 'CANDIDATE' | 'COMMAND';

interface WebSocketMessage {
    type: MessageType;
    deviceId?: string;
    sdp?: { type: 'offer' | 'answer', sdp: string };
    iceCandidate?: any;
    input?: {
        type: 'TOUCH' | 'KEY';
        action: 'DOWN' | 'UP' | 'MOVE' | 'CLICK';
        x?: number;
        y?: number;
        keyCode?: number;
    };
    command?: any;
    // Add other fields as needed
}

class SocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<MessageType, (data: any) => void> = new Map();
    private url = 'ws://localhost:3008/agent'; // Update with proper env var in real app

    connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const token = useAuthStore.getState().token;
        // In a real app, you might pass the token in the URL or headers (if supported)
        // For this raw WebSocket implementation, we'll assume the backend validates purely on connection or initial message
        // But since we built a raw WS gateway, let's just connect.

        console.log('Connecting to WebSocket:', this.url);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                // console.log('WS Received:', message.type);

                const listener = this.listeners.get(message.type);
                if (listener) {
                    listener(message);
                }
            } catch (e) {
                console.error('Error parsing WS message', e);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
        };

        this.socket.onerror = (err) => {
            console.error('WebSocket Error', err);
        };
    }

    on(type: MessageType, callback: (data: any) => void) {
        this.listeners.set(type, callback);
    }

    send(message: WebSocketMessage) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not open. Cannot send:', message.type);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
