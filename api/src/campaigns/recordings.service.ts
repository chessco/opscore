import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RecordingsService {
    constructor(private prisma: PrismaService) {}

    // Link a new multimedia recording file with an active interaction
    async createRecording(
        tenantId: string,
        interactionId: string,
        base64Audio: string,
        duration: number,
        fileSize: number
    ) {
        // Enforce owner verification on parent interaction
        const interaction = await this.prisma.interaction.findFirst({
            where: { id: interactionId, tenantId }
        });
        if (!interaction) {
            throw new NotFoundException('Interaction not found or not owned by your tenant');
        }

        // Save base64 to file
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const fileName = `rec_${interactionId}_${Date.now()}.mp4`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Remove prefix like 'data:audio/mp4;base64,' if present
        const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        
        const fileUrl = `/uploads/${fileName}`;

        return this.prisma.recording.create({
            data: {
                fileUrl,
                duration,
                fileSize,
                encrypted: true,
                tenantId,
                interactionId
            }
        });
    }

    // Retrieve recordings mapped to a specific interaction
    async getRecordingByInteraction(tenantId: string, interactionId: string) {
        // Verify ownership
        const interaction = await this.prisma.interaction.findFirst({
            where: { id: interactionId, tenantId }
        });
        if (!interaction) {
            throw new NotFoundException('Interaction not found');
        }

        return this.prisma.recording.findMany({
            where: { interactionId, tenantId }
        });
    }
}
