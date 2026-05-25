import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as http from 'http';

interface ConnectedClient {
    socket: WebSocket;
    type: 'browser' | 'agent' | 'unknown';
    deviceId?: string;
    connectedAt: Date;
}

@WebSocketGateway({ path: '/agent' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private clients: Map<WebSocket, ConnectedClient> = new Map();

    handleConnection(client: WebSocket, request: http.IncomingMessage) {
        const userAgent = request.headers['user-agent'] || '';
        const clientType = userAgent.includes('okhttp') ? 'agent' : 'browser';
        
        const clientInfo: ConnectedClient = {
            socket: client,
            type: clientType,
            connectedAt: new Date(),
        };
        this.clients.set(client, clientInfo);
        
        console.log(`[WS] Client connected: type=${clientType}, total=${this.clients.size}`);

        client.on('message', (message: any) => {
            try {
                const text = message.toString();
                let parsed: any = {};
                try { parsed = JSON.parse(text); } catch (_) { /* ignore */ }

                const msgType = parsed.type || 'unknown';
                const deviceId = parsed.deviceId;

                if (deviceId && !clientInfo.deviceId) {
                    clientInfo.deviceId = deviceId;
                    console.log(`[WS] Associated deviceId=${deviceId} with connection`);
                }

                console.log(`[WS] Message type=${msgType}, deviceId=${deviceId}, from=${clientType}, clients=${this.clients.size}`);

                // Relay to all other connected clients
                let relayCount = 0;
                this.server.clients.forEach(c => {
                    if (c !== client && c.readyState === WebSocket.OPEN) {
                        c.send(text);
                        relayCount++;
                    }
                });

                console.log(`[WS] Relayed to ${relayCount} client(s)`);
            } catch (e) {
                console.error('[WS] Error handling message', e);
            }
        });

        client.on('error', (err) => {
            console.error(`[WS] Client error (${clientType}):`, err.message);
        });
    }

    handleDisconnect(client: WebSocket) {
        const info = this.clients.get(client);
        this.clients.delete(client);
        console.log(`[WS] Client disconnected: type=${info?.type || 'unknown'}, remaining=${this.clients.size}`);
    }

    /** Returns number of currently connected clients */
    getConnectedCount(): number {
        return this.clients.size;
    }

    /** Dispatches a direct command payload to a specific registered device */
    sendToDevice(deviceId: string, payload: any): boolean {
        const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
        let sent = false;
        this.clients.forEach((clientInfo) => {
            if (clientInfo.deviceId === deviceId && clientInfo.socket.readyState === WebSocket.OPEN) {
                clientInfo.socket.send(text);
                sent = true;
            }
        });
        return sent;
    }
}
