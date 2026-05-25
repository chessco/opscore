import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DialerService } from './dialer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EntitlementGuard } from '../marketplace/guards/entitlement.guard';
import { RequireModule } from '../marketplace/decorators/require-module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('dialer')
@RequireModule('mod_dialer')
export class DialerController {
    constructor(private readonly dialerService: DialerService) {}

    @Get('next/:campaignId')
    @UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    getNextLead(@Req() req: any, @Param('campaignId') campaignId: string) {
        return this.dialerService.getNextLead(req.user.tenantId, campaignId);
    }

    @Post('dial/:leadId')
    @UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    dialLead(@Req() req: any, @Param('leadId') leadId: string) {
        return this.dialerService.dialLead(req.user.tenantId, leadId, req.user.userId);
    }

    @Post('stop/:interactionId')
    @UseGuards(JwtAuthGuard, RolesGuard, EntitlementGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    stopDialing(@Req() req: any, @Param('interactionId') interactionId: string) {
        return this.dialerService.stopDialing(req.user.tenantId, interactionId, req.user.userId);
    }

    // Public route for testing backend dial
    @Get('test-dial/:leadId')
    async testDial(@Param('leadId') leadId: string) {
        // Find first tenant and user to satisfy arguments
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return 'Lead not found';
        const user = await prisma.user.findFirst({ where: { tenantId: lead.tenantId } });
        await prisma.$disconnect();
        
        return this.dialerService.dialLead(lead.tenantId, leadId, user?.id || 'sys');
    }
}
