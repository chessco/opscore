import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(@Req() req: any, @Body() body: { name: string; description?: string; surveyType?: string; externalSurveyUrl?: string; cooldownDays?: number }) {
        return this.campaignsService.create(req.user.tenantId, body.name, body.description, body.surveyType, body.externalSurveyUrl, body.cooldownDays);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findAll(@Req() req: any) {
        return this.campaignsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.campaignsService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; status?: string; surveyType?: string; externalSurveyUrl?: string; cooldownDays?: number }
    ) {
        return this.campaignsService.update(req.user.tenantId, id, body.name, body.description, body.status, body.surveyType, body.externalSurveyUrl, body.cooldownDays);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.campaignsService.remove(req.user.tenantId, id);
    }
}
