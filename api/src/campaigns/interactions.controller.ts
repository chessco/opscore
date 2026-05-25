import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EntitlementGuard } from '../marketplace/guards/entitlement.guard';
import { RequireModule } from '../marketplace/decorators/require-module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('interactions')
@UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
@RequireModule('mod_interactions')
export class InteractionsController {
    constructor(private readonly interactionsService: InteractionsService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    create(
        @Req() req: any,
        @Body() body: { campaignId: string; leadId: string; surveyId?: string }
    ) {
        return this.interactionsService.create(req.user.tenantId, body.campaignId, body.leadId, body.surveyId);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findAll(@Req() req: any) {
        return this.interactionsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.interactionsService.findOne(req.user.tenantId, id);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    updateStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { status: string; agentId?: string; deviceId?: string }
    ) {
        return this.interactionsService.updateStatus(
            req.user.tenantId,
            id,
            body.status,
            body.agentId || req.user.userId,
            body.deviceId
        );
    }

    @Post(':id/response')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    saveResponse(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { response: any }
    ) {
        return this.interactionsService.saveSurveyResponse(req.user.tenantId, id, body.response);
    }
}
