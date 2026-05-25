import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventsService extends EventEmitter {
    constructor() {
        super();
        // Set higher limit for listeners to prevent warnings
        this.setMaxListeners(100);
    }

    // Emit typed events with standardized schemas as defined in Section 21 of PRD
    emitEvent(name: string, tenantId: string, payload: any) {
        const eventFrame = {
            eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            tenantId,
            payload
        };

        // Emit internally for backend subscribers
        this.emit(name, eventFrame);

        console.log(`[EventBus] Emitted event "${name}" for tenant ${tenantId}`);
        return eventFrame;
    }
}
