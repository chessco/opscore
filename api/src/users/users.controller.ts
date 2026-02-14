import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    create(@Request() req, @Body() createUserDto: Prisma.UserCreateInput) {
        const user = req.user;

        // If Supervisor, force tenantId to be their own
        if (user.role === UserRole.SUPERVISOR) {
            const targetTenantId = createUserDto.tenant?.connect?.id;
            if (!targetTenantId || targetTenantId !== user.tenantId) {
                throw new ForbiddenException('Supervisors can only create users in their own tenant');
            }
        }

        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    findAll(@Request() req) {
        const user = req.user;

        if (user.role === UserRole.SUPERVISOR) {
            return this.usersService.findAll({
                where: { tenantId: user.tenantId },
            });
        }

        return this.usersService.findAll({});
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async findOne(@Request() req, @Param('id') id: string) {
        // Only implemented minimal logic for now
        return this.usersService.findAll({ where: { id } }).then(users => users[0]);
    }
}
