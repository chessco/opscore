type MessageType = 'OFFER' | 'ANSWER' | 'CANDIDATE' | 'COMMAND' | 'INPUT';

interface WebSocketMessage {
    type: MessageType;
    deviceId?: string;
    sdp?: { type: 'offer' | 'answer', sdp: string };
    iceCandidate?: any;
    input?: {
        type: 'TOUCH' | 'KEY';
        action: 'DOWN' | 'UP' | 'MOVE' | 'CLICK' | 'BACK' | 'HOME' | 'RECENT' | 'NOTIFICATIONS' | 'QS' | 'POWER';
        x?: number;
        y?: number;
        keyCode?: number;
    };
    command?: any;
}

type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

class SocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<MessageType, (data: any) => void> = new Map();
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    private url = (() => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        if (apiUrl) {
            return apiUrl.replace(/^http/, 'ws') + '/agent';
        }
        return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3008/agent`;
    })();
    private reconnectDelay = 2000;
    private maxReconnectDelay = 30000;
    private pendingQueue: WebSocketMessage[] = [];

    private _status: ConnectionStatus = 'closed';

    get status(): ConnectionStatus {
        return this._status;
    }

    private setStatus(s: ConnectionStatus) {
        this._status = s;
        this.statusListeners.forEach(cb => cb(s));
    }

    onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(callback);
        // Immediately notify current status
        callback(this._status);
        return () => this.statusListeners.delete(callback);
    }

    connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log('[WS] Connecting to:', this.url);
        this.setStatus('connecting');
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('[WS] Connected');
            this.reconnectDelay = 2000; // Reset delay on successful connect
            this.setStatus('open');
            // Flush pending messages
            while (this.pendingQueue.length > 0) {
                const msg = this.pendingQueue.shift()!;
                this.socket?.send(JSON.stringify(msg));
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                const listener = this.listeners.get(message.type);
                if (listener) {
                    listener(message);
                }
            } catch (e) {
                console.error('[WS] Error parsing message', e);
            }
        };

        this.socket.onclose = (ev) => {
            console.log(`[WS] Disconnected (code=${ev.code}). Reconnecting in ${this.reconnectDelay}ms...`);
            this.setStatus('closed');
            this.socket = null;
            setTimeout(() => this.connect(), this.reconnectDelay);
            // Exponential backoff
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
        };

        this.socket.onerror = () => {
            console.error('[WS] Connection error');
            this.setStatus('error');
        };
    }

    on(type: MessageType, callback: (data: any) => void) {
        this.listeners.set(type, callback);
    }

    send(message: WebSocketMessage) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            console.log('[WS] Sent:', message.type, message.deviceId);
        } else {
            console.warn('[WS] Not open. Queuing:', message.type);
            // Queue control messages for retry when connection opens
            if (message.type === 'INPUT') {
                this.pendingQueue.push(message);
                // Don't let queue grow unbounded
                if (this.pendingQueue.length > 20) this.pendingQueue.shift();
            }
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
export type { ConnectionStatus };

