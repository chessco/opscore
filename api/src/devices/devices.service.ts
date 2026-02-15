import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Device, DeviceStatus } from '@prisma/client';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.DeviceCreateInput): Promise<Device> {
        return this.prisma.device.create({
            data,
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.DeviceWhereUniqueInput;
        where?: Prisma.DeviceWhereInput;
        orderBy?: Prisma.DeviceOrderByWithRelationInput;
    }): Promise<Device[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.device.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                operator: {
                    select: { fullName: true, email: true },
                },
            },
        });
    }

    async findOne(id: string): Promise<Device | null> {
        return this.prisma.device.findUnique({
            where: { id },
            include: {
                operator: {
                    select: { fullName: true, email: true },
                },
            },
        });
    }

    async update(params: {
        where: Prisma.DeviceWhereUniqueInput;
        data: Prisma.DeviceUpdateInput;
    }): Promise<Device> {
        const { where, data } = params;
        return this.prisma.device.update({
            data,
            where,
        });
    }

    async remove(where: Prisma.DeviceWhereUniqueInput): Promise<Device> {
        return this.prisma.device.delete({
            where,
        });
    }

    async updateHeartbeat(id: string): Promise<Device> {
        return this.prisma.device.update({
            where: { id },
            data: {
                status: DeviceStatus.ONLINE,
                updatedAt: new Date(), // Force update
            },
        });
    }
}
