import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { DevicesService } from '../devices/devices.service';
import { Inject, forwardRef } from '@nestjs/common';

interface ConnectedClient {
    socket: WebSocket;
    type: 'browser' | 'agent' | 'unknown';
    deviceId?: string;
    tenantId?: string;
    connectedAt: Date;
}

@WebSocketGateway({ path: '/agent' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private clients: Map<WebSocket, ConnectedClient> = new Map();

    constructor(
        @Inject(forwardRef(() => DevicesService))
        private readonly devicesService: DevicesService
    ) {}

    handleConnection(client: WebSocket, request: http.IncomingMessage) {
        const userAgent = request.headers['user-agent'] || '';
        const clientType = userAgent.includes('okhttp') ? 'agent' : 'browser';
        
        let tenantId: string | undefined;
        let authHeader = request.headers['authorization'];
        
        // Parse URL query parameter as fallback if header is missing
        if (!authHeader && request.url?.includes('token=')) {
            const urlObj = new URL(request.url, `http://${request.headers.host}`);
            const tokenQuery = urlObj.searchParams.get('token');
            if (tokenQuery) {
                authHeader = `Bearer ${tokenQuery}`;
            }
        }
        
        console.log(`[WS DEBUG] Connection URL:`, request.url);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.decode(token) as any;
                if (decoded && decoded.tenantId) {
                    tenantId = decoded.tenantId;
                }
            } catch (e) {
                console.error('[WS] Error decoding JWT during connection', e);
            }
        }

        const clientInfo: ConnectedClient = {
            socket: client,
            type: clientType,
            tenantId,
            connectedAt: new Date(),
        };
        this.clients.set(client, clientInfo);
        
        console.log(`[WS] Client connected: type=${clientType}, tenantId=${tenantId || 'unknown'}, total=${this.clients.size}`);

        client.on('message', async (message: any) => {
            try {
                const text = message.toString();
                let parsed: any = {};
                try { parsed = JSON.parse(text); } catch (_) { /* ignore */ }

                const msgType = parsed.type || 'unknown';
                const deviceId = parsed.deviceId;

                if (deviceId && !clientInfo.deviceId) {
                    clientInfo.deviceId = deviceId;
                    console.log(`[WS] Associated deviceId=${deviceId} with connection`);
                    
                    // Auto-register device for Android agents if we have tenant info
                    if (clientInfo.type === 'agent' && clientInfo.tenantId) {
                        try {
                            const existing = await this.devicesService.findOne(deviceId);
                            if (!existing) {
                                await this.devicesService.create({
                                    id: deviceId,
                                    androidId: deviceId,
                                    name: `Pitaya Agent (${deviceId.substring(0, 4)})`,
                                    status: 'ONLINE',
                                    tenant: { connect: { id: clientInfo.tenantId } }
                                });
                                console.log(`[WS] Auto-registered device ${deviceId} in database`);
                            } else {
                                await this.devicesService.update({
                                    where: { id: deviceId },
                                    data: { status: 'ONLINE' }
                                });
                                console.log(`[WS] Updated existing device ${deviceId} to ONLINE`);
                            }
                        } catch (err) {
                            console.error(`[WS] Auto-registration failed for device ${deviceId}`, err);
                        }
                    }
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
        
        // Update device status to OFFLINE
        if (info?.type === 'agent' && info?.deviceId) {
            this.devicesService.update({
                where: { id: info.deviceId },
                data: { status: 'OFFLINE' }
            }).catch(e => console.error(`[WS] Failed to set device ${info.deviceId} offline:`, e));
        }
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
