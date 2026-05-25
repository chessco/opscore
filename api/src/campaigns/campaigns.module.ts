import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { DialerService } from './dialer.service';
import { DialerController } from './dialer.controller';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { AgentController } from './agent.controller';

@Module({
    imports: [PrismaModule, EventsModule, MarketplaceModule],
    controllers: [
        CampaignsController,
        SurveysController,
        LeadsController,
        InteractionsController,
        DialerController,
        RecordingsController,
        AgentController
    ],
    providers: [
        CampaignsService,
        SurveysService,
        LeadsService,
        InteractionsService,
        DialerService,
        RecordingsService
    ],
    exports: [
        CampaignsService,
        SurveysService,
        LeadsService,
        InteractionsService,
        DialerService,
        RecordingsService
    ]
})
export class CampaignsModule {}
