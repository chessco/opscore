import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Prisma, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(@Request() req, @Body() createDeviceDto: Prisma.DeviceCreateInput) {
        const user = req.user;
        if (user.role === UserRole.SUPERVISOR) {
            if (createDeviceDto.tenant.connect?.id !== user.tenantId) {
                throw new ForbiddenException('Supervisors can only create devices for their own tenant');
            }
        }
        return this.devicesService.create(createDeviceDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    findAll(@Request() req) {
        const user = req.user;
        const where: Prisma.DeviceWhereInput = {};

        if (user.role === UserRole.SUPERVISOR || user.role === UserRole.OPERATOR) {
            where.tenantId = user.tenantId;
        }

        return this.devicesService.findAll({ where });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR)
    async findOne(@Request() req, @Param('id') id: string) {
        const user = req.user;
        const device = await this.devicesService.findOne(id);

        if (!device) return null;

        if (user.role !== UserRole.ADMIN && device.tenantId !== user.tenantId) {
            throw new ForbiddenException('Access to this device is restricted');
        }
        return device;
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async update(@Request() req, @Param('id') id: string, @Body() updateDeviceDto: Prisma.DeviceUpdateInput) {
        const user = req.user;

        // Check ownership first
        const device = await this.devicesService.findOne(id);
        if (!device) return null;

        if (user.role !== UserRole.ADMIN && device.tenantId !== user.tenantId) {
            throw new ForbiddenException('Cannot update device from another tenant');
        }

        return this.devicesService.update({
            where: { id },
            data: updateDeviceDto,
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async remove(@Request() req, @Param('id') id: string) {
        const user = req.user;

        // Check ownership first
        const device = await this.devicesService.findOne(id);
        if (!device) return null;

        if (user.role !== UserRole.ADMIN && device.tenantId !== user.tenantId) {
            throw new ForbiddenException('Cannot delete device from another tenant');
        }

        return this.devicesService.remove({ id });
    }

    @Post(':id/heartbeat')
    // Public for now to simulate device sending it without sophisticated auth
    async heartbeat(@Param('id') id: string) {
        return this.devicesService.updateHeartbeat(id);
    }
}
