import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
        return this.prisma.tenant.create({
            data,
        });
    }

    async findAll(): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            where: { active: true },
        });
    }

    async findOne(id: string): Promise<Tenant | null> {
        return this.prisma.tenant.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Tenant> {
        // Soft delete
        return this.prisma.tenant.update({
            where: { id },
            data: { active: false },
        });
    }
}
