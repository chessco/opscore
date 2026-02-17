import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/agent' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: WebSocket) {
        console.log('Client connected');
        client.on('message', (message: any) => {
            try {
                const text = message.toString();
                // console.log('Received:', text); // Uncomment for debug

                // Broadcast to all other clients (Simple Relay)
                this.server.clients.forEach(c => {
                    if (c !== client && c.readyState === WebSocket.OPEN) {
                        c.send(text);
                    }
                });
            } catch (e) {
                console.error('Error handling message', e);
            }
        });
    }

    handleDisconnect(client: WebSocket) {
        console.log('Client disconnected');
    }
}
