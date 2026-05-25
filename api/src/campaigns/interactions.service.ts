import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class InteractionsService {
    constructor(
        private prisma: PrismaService,
        private eventsService: EventsService
    ) {}

    async create(tenantId: string, campaignId: string, leadId: string, surveyId?: string) {
        // Verify relations exist and are owned by this tenant
        const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, tenantId } });
        if (!campaign) throw new NotFoundException('Campaign not found');

        const lead = await this.prisma.lead.findFirst({ where: { id: leadId, tenantId } });
        if (!lead) throw new NotFoundException('Lead not found');

        if (surveyId) {
            const survey = await this.prisma.survey.findFirst({ where: { id: surveyId, tenantId } });
            if (!survey) throw new NotFoundException('Survey not found');
        }

        const interaction = await this.prisma.interaction.create({
            data: {
                status: 'PENDING',
                tenantId,
                campaignId,
                leadId,
                surveyId: surveyId || null,
            },
            include: { lead: true }
        });

        // Sync lead state
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { status: 'QUEUED' }
        });

        this.eventsService.emitEvent('interaction.created', tenantId, {
            interactionId: interaction.id,
            campaignId,
            leadId,
            phone: interaction.lead.phone
        });

        return interaction;
    }

    async findAll(tenantId: string) {
        return this.prisma.interaction.findMany({
            where: { tenantId },
            include: {
                lead: true,
                campaign: { select: { name: true } },
                survey: { select: { title: true } },
                recordings: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        const interaction = await this.prisma.interaction.findFirst({
            where: { id, tenantId },
            include: {
                lead: true,
                campaign: true,
                survey: true,
                agent: { select: { id: true, fullName: true, email: true } },
                device: true
            }
        });

        if (!interaction) {
            throw new NotFoundException('Interaction not found');
        }

        return interaction;
    }

    // Handles the core operational interaction state-machine
    async updateStatus(tenantId: string, id: string, status: string, agentId?: string, deviceId?: string) {
        const interaction = await this.findOne(tenantId, id);

        const validStates = [
            'PENDING', 'ASSIGNED', 'DIALING', 'RINGING', 'ANSWERED', 
            'SURVEY_ACTIVE', 'COMPLETED', 'FAILED', 'ABANDONED', 'CALLBACK'
        ];
        if (!validStates.includes(status)) {
            throw new BadRequestException(`Invalid interaction status: ${status}`);
        }

        const updated = await this.prisma.interaction.update({
            where: { id },
            data: {
                status,
                ...(agentId && { agentId }),
                ...(deviceId && { deviceId }),
            },
            include: { lead: true }
        });

        // Trigger side-effects based on target state transitions
        if (status === 'ASSIGNED') {
            await this.prisma.lead.update({
                where: { id: interaction.leadId },
                data: { status: 'CONTACTING' }
            });
            this.eventsService.emitEvent('lead.assigned', tenantId, {
                interactionId: id,
                leadId: interaction.leadId,
                agentId,
                deviceId
            });
        } else if (status === 'SURVEY_ACTIVE') {
            this.eventsService.emitEvent('survey.loaded', tenantId, {
                interactionId: id,
                leadId: interaction.leadId,
                surveyId: interaction.surveyId
            });
        } else if (['COMPLETED', 'FAILED', 'ABANDONED', 'CALLBACK'].includes(status)) {
            // Sync lead status
            let leadStatus = 'CONTACTED';
            if (status === 'FAILED') leadStatus = 'RETRIED';
            if (status === 'CALLBACK') leadStatus = 'QUEUED'; // Re-queue

            await this.prisma.lead.update({
                where: { id: interaction.leadId },
                data: { 
                    status: leadStatus,
                    ...(leadStatus === 'CONTACTED' && { lastCalledAt: new Date() })
                }
            });

            this.eventsService.emitEvent('interaction.completed', tenantId, {
                interactionId: id,
                leadId: interaction.leadId,
                status
            });
        }

        return updated;
    }

    // Dynamic JSON survey response submission
    async saveSurveyResponse(tenantId: string, id: string, response: any) {
        const interaction = await this.findOne(tenantId, id);

        const updated = await this.prisma.interaction.update({
            where: { id },
            data: {
                surveyResponse: response as any,
                status: 'COMPLETED'
            },
            include: { lead: true }
        });

        // Set lead to contacted
        await this.prisma.lead.update({
            where: { id: interaction.leadId },
            data: { 
                status: 'CONTACTED',
                lastCalledAt: new Date()
            }
        });

        // Dispatch completed event frame
        this.eventsService.emitEvent('interaction.completed', tenantId, {
            interactionId: id,
            leadId: interaction.leadId,
            surveyId: interaction.surveyId,
            status: 'COMPLETED',
            responseSummary: response
        });

        return updated;
    }
}
