import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) {}

    async create(tenantId: string, campaignId: string, phone: string, name: string, metadata?: any) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId }
        });
        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        return this.prisma.lead.create({
            data: {
                phone,
                name,
                status: 'NEW',
                metadata: metadata || null,
                tenantId,
                campaignId
            }
        });
    }

    // Ingest bulk leads inside a transaction block
    async importLeads(tenantId: string, campaignId: string, leadsList: Array<{ phone: string; name: string; metadata?: any }>) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId }
        });
        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (!Array.isArray(leadsList) || leadsList.length === 0) {
            throw new BadRequestException('Leads list must be a non-empty array');
        }

        // Generate data structures
        const dataToCreate = leadsList.map(lead => ({
            phone: lead.phone,
            name: lead.name,
            status: 'NEW',
            metadata: lead.metadata || null,
            tenantId,
            campaignId
        }));

        // Execute bulk insert via prisma createMany
        return this.prisma.lead.createMany({
            data: dataToCreate
        });
    }

    async findAll(tenantId: string, campaignId?: string) {
        return this.prisma.lead.findMany({
            where: {
                tenantId,
                ...(campaignId && { campaignId })
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        const lead = await this.prisma.lead.findFirst({
            where: { id, tenantId },
            include: { campaign: true, interactions: true }
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return lead;
    }

    async updateStatus(tenantId: string, id: string, status: string) {
        await this.findOne(tenantId, id);

        return this.prisma.lead.update({
            where: { id },
            data: { status }
        });
    }

    async update(tenantId: string, id: string, data: { name?: string; phone?: string; metadata?: any }) {
        await this.findOne(tenantId, id);

        return this.prisma.lead.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.phone && { phone: data.phone }),
                ...(data.metadata !== undefined && { metadata: data.metadata })
            }
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);

        return this.prisma.$transaction(async (tx) => {
            // Delete interactions associated with this lead
            await tx.interaction.deleteMany({ where: { leadId: id } });
            return tx.lead.delete({ where: { id } });
        });
    }
}
