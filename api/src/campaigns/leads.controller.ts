import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EntitlementGuard } from '../marketplace/guards/entitlement.guard';
import { RequireModule } from '../marketplace/decorators/require-module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
@RequireModule('mod_leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(
        @Req() req: any,
        @Body() body: { campaignId: string; phone: string; name: string; metadata?: any }
    ) {
        return this.leadsService.create(req.user.tenantId, body.campaignId, body.phone, body.name, body.metadata);
    }

    @Post('import')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    importLeads(
        @Req() req: any,
        @Body() body: { campaignId: string; leads: Array<{ phone: string; name: string; metadata?: any }> }
    ) {
        return this.leadsService.importLeads(req.user.tenantId, body.campaignId, body.leads);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findAll(@Req() req: any) {
        return this.leadsService.findAll(req.user.tenantId);
    }

    @Get('campaign/:campaignId')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findByCampaign(@Req() req: any, @Param('campaignId') campaignId: string) {
        return this.leadsService.findAll(req.user.tenantId, campaignId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.leadsService.findOne(req.user.tenantId, id);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    updateStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { status: string }
    ) {
        return this.leadsService.updateStatus(req.user.tenantId, id, body.status);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { name?: string; phone?: string; metadata?: any }
    ) {
        return this.leadsService.update(req.user.tenantId, id, body);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.leadsService.remove(req.user.tenantId, id);
    }
}
