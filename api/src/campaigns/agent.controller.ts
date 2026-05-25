import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('agent')
export class AgentController {
    constructor(
        private recordingsService: RecordingsService,
        private prisma: PrismaService
    ) {}

    @Post('upload-recording')
    async uploadRecording(
        @Body() body: { interactionId: string; base64Audio: string; duration: number; fileSize: number }
    ) {
        // Find interaction to get tenantId
        const interaction = await this.prisma.interaction.findUnique({
            where: { id: body.interactionId }
        });

        if (!interaction) {
            throw new NotFoundException('Interaction not found');
        }

        return this.recordingsService.createRecording(
            interaction.tenantId,
            body.interactionId,
            body.base64Audio,
            body.duration,
            body.fileSize
        );
    }
}
