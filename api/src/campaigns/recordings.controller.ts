import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EntitlementGuard } from '../marketplace/guards/entitlement.guard';
import { RequireModule } from '../marketplace/decorators/require-module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('recordings')
@UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
@RequireModule('mod_recordings')
export class RecordingsController {
    constructor(private readonly recordingsService: RecordingsService) {}

    @Get('interaction/:interactionId')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    getRecordingByInteraction(@Req() req: any, @Param('interactionId') interactionId: string) {
        return this.recordingsService.getRecordingByInteraction(req.user.tenantId, interactionId);
    }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(
        @Req() req: any,
        @Body() body: { interactionId: string; base64Audio: string; duration: number; fileSize: number }
    ) {
        return this.recordingsService.createRecording(
            req.user.tenantId,
            body.interactionId,
            body.base64Audio,
            body.duration,
            body.fileSize
        );
    }
}
