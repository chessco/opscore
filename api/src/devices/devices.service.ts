import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Device, DeviceStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';

const execAsync = util.promisify(exec);

@Injectable()
export class DevicesService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => EventsGateway))
        private eventsGateway: EventsGateway,
    ) { }

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

    async deployApk(payload: any) {
        const apkPath = path.join(process.cwd(), 'uploads', 'agent.apk');
        const results = {
            adb: { success: false, message: '' },
            websocket: { success: false, count: 0 }
        };

        // 1. Try ADB
        try {
            const { stdout: devicesOut } = await execAsync('adb devices');
            const lines = devicesOut.split('\n').filter(l => l.trim().length > 0 && !l.includes('List of devices'));
            if (lines.length > 0) {
                // Install on the first connected device
                try {
                    await execAsync(`adb install -r "${apkPath}"`);
                    results.adb = { success: true, message: 'Installed via ADB' };
                } catch (installErr: any) {
                    results.adb = { success: false, message: `ADB Install Error: ${installErr.message}` };
                }
            } else {
                results.adb = { success: false, message: 'No ADB devices found' };
            }
        } catch (err: any) {
            results.adb = { success: false, message: `ADB Command Error: ${err.message}` };
        }

        // 2. Try WebSocket
        try {
            // Broadcast a DOWNLOAD_APK command to all clients
            const wsPayload = {
                type: 'DOWNLOAD_APK',
                url: payload.sourceUrl, // Should be sent from frontend
                ...payload
            };
            
            // We can iterate over all server clients via EventsGateway
            let relayCount = 0;
            this.eventsGateway.server.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify(wsPayload));
                    relayCount++;
                }
            });
            results.websocket = { success: true, count: relayCount };
        } catch (wsErr: any) {
            results.websocket = { success: false, count: 0 };
        }

        return results;
    }
}
