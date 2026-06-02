import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
    imports: [forwardRef(() => DevicesModule)],
    providers: [EventsGateway, EventsService],
    exports: [EventsGateway, EventsService],
})
export class EventsModule { }
