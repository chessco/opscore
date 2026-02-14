import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Prisma, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createTenantDto: Prisma.TenantCreateInput) {
        return this.tenantsService.create(createTenantDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.tenantsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateTenantDto: Prisma.TenantUpdateInput) {
        return this.tenantsService.update(id, updateTenantDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.tenantsService.remove(id);
    }
}
