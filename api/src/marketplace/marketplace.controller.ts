import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('marketplace')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) {}

    @Get('suites')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SYSTEM)
    async getSuites(@Req() req: any) {
        // Return suites assigned to the active user's tenant
        return this.marketplaceService.getTenantSuites(req.user.tenantId);
    }

    @Get('modules')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SYSTEM)
    async getModules(@Req() req: any) {
        // Return modules active or assignable for the active user's tenant
        return this.marketplaceService.getTenantModules(req.user.tenantId);
    }

    @Post('suites/assign')
    @Roles(UserRole.ADMIN, UserRole.SYSTEM)
    async assignSuite(
        @Req() req: any,
        @Body() body: { tenantId: string; suiteId: string; licenseKey: string; expiresAt: string }
    ) {
        // Only SYSTEM role can assign a suite. (For compatibility, we allow ADMIN if they act as super-admin)
        if (req.user.role !== 'SYSTEM' && req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only system administrators can allocate licenses');
        }

        const expiresDate = new Date(body.expiresAt);
        return this.marketplaceService.assignSuite(
            body.tenantId || req.user.tenantId,
            body.suiteId,
            body.licenseKey,
            expiresDate
        );
    }

    @Post('modules/assign')
    @Roles(UserRole.ADMIN, UserRole.SYSTEM)
    async assignModule(
        @Req() req: any,
        @Body() body: { tenantId?: string; moduleId: string; isActive: boolean }
    ) {
        const targetTenantId = body.tenantId || req.user.tenantId;

        // If trying to modify another tenant's modules, verify user is SYSTEM/ADMIN
        if (targetTenantId !== req.user.tenantId && req.user.role !== 'SYSTEM' && req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Not authorized to access other tenant records');
        }

        return this.marketplaceService.assignModule(
            targetTenantId,
            body.moduleId,
            body.isActive,
            req.user.role
        );
    }
}
