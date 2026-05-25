import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { EventsService } from '../events/events.service';

@Injectable()
export class DialerService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private eventsService: EventsService
    ) {}

    // Fetch the next assignable lead from the active campaign outbox queue
    async getNextLead(tenantId: string, campaignId: string) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId }
        });
        if (!campaign) throw new NotFoundException('Campaign not found');

        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() - (campaign.cooldownDays || 30));

        const nextLead = await this.prisma.lead.findFirst({
            where: {
                tenantId,
                campaignId,
                OR: [
                    { status: { in: ['NEW', 'RETRIED'] } },
                    { 
                        status: 'CONTACTED',
                        lastCalledAt: { lt: cooldownDate }
                    }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        if (!nextLead) {
            throw new NotFoundException('No leads left to dial in this campaign');
        }

        return nextLead;
    }

    // Automates dispatch of telephone dial command to physical Android hardware
    async dialLead(tenantId: string, leadId: string, agentId: string) {
        const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, tenantId }
        });
        if (!lead) throw new NotFoundException('Lead not found');

        // Locate paired and connected physical device for this agent
        let device = await this.prisma.device.findFirst({
            where: {
                tenantId,
                operatorId: agentId,
                status: 'ONLINE'
            }
        });

        if (!device) {
            // Fallback for testing: find ANY online device
            device = await this.prisma.device.findFirst({
                where: { tenantId, status: 'ONLINE' }
            });
        }

        if (!device) {
            throw new BadRequestException('No active physical Android device is available. Please connect a device.');
        }

        // Initialize dynamic operational interaction record
        return this.prisma.$transaction(async (tx) => {
            const interaction = await tx.interaction.create({
                data: {
                    status: 'DIALING',
                    tenantId,
                    campaignId: lead.campaignId,
                    leadId,
                    agentId,
                    deviceId: device.id,
                },
                include: { lead: true, campaign: true }
            });

            // Update lead status
            await tx.lead.update({
                where: { id: leadId },
                data: { status: 'CONTACTING' }
            });

            // Dispatch command frame directly to physical Android agent WebSocket
            const payload = {
                type: 'DIAL',
                deviceId: device.androidId,
                phoneNumber: lead.phone,
                interactionId: interaction.id
            };

            console.log(`[DialerService] Attempting to send DIAL to device ${device.androidId} (WS Connected count: ${this.eventsGateway.getConnectedCount()})`);
            const dispatched = this.eventsGateway.sendToDevice(device.androidId, payload);
            console.log(`[DialerService] Dispatched DIAL command to device ${device.androidId}. Status=${dispatched}`);

            // Emit event on internal bus
            this.eventsService.emitEvent('lead.assigned', tenantId, {
                interactionId: interaction.id,
                leadId,
                agentId,
                deviceId: device.id,
                deviceSerial: device.androidId,
                dispatched
            });

            return {
                interaction,
                deviceAssociated: device.name,
                websocketDispatched: dispatched
            };
        });
    }

    // Automates dispatch of STOP_RECORDING command
    async stopDialing(tenantId: string, interactionId: string, agentId: string) {
        const interaction = await this.prisma.interaction.findFirst({
            where: { id: interactionId, tenantId, agentId },
            include: { device: true }
        });
        if (!interaction) throw new NotFoundException('Interaction not found');

        if (interaction.device) {
            const payload = {
                type: 'STOP_RECORDING',
                deviceId: interaction.device.androidId,
                interactionId: interaction.id
            };
            this.eventsGateway.sendToDevice(interaction.device.androidId, payload);
        }

        return { success: true };
    }
}
