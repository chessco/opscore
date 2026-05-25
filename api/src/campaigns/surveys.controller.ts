import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EntitlementGuard } from '../marketplace/guards/entitlement.guard';
import { RequireModule } from '../marketplace/decorators/require-module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
@RequireModule('mod_surveys')
export class SurveysController {
    constructor(private readonly surveysService: SurveysService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(
        @Req() req: any,
        @Body() body: { campaignId: string; title: string; schema: any }
    ) {
        return this.surveysService.create(req.user.tenantId, body.campaignId, body.title, body.schema);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findAll(@Req() req: any) {
        return this.surveysService.findAll(req.user.tenantId);
    }

    @Get('campaign/:campaignId')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findByCampaign(@Req() req: any, @Param('campaignId') campaignId: string) {
        return this.surveysService.findByCampaign(req.user.tenantId, campaignId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.surveysService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { title?: string; schema?: any; isActive?: boolean }
    ) {
        return this.surveysService.update(req.user.tenantId, id, body.title, body.schema, body.isActive);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.surveysService.remove(req.user.tenantId, id);
    }
}
