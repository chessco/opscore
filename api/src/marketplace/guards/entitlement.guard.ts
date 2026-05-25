import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MarketplaceService } from '../marketplace.service';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class EntitlementGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private marketplaceService: MarketplaceService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredModule = this.reflector.getAllAndOverride<string>(REQUIRE_MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If route does not require a module assignment, allow access
        if (!requiredModule) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            throw new ForbiddenException('User session or tenant context is missing');
        }

        // SYSTEM super-admins bypass module restrictions
        if (user.role === 'SYSTEM') {
            return true;
        }

        const isActive = await this.marketplaceService.isModuleActive(user.tenantId, requiredModule);
        if (!isActive) {
            throw new ForbiddenException(`The required module (${requiredModule}) is inactive or not licensed for your organization.`);
        }

        return true;
    }
}
