import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
    constructor(private prisma: PrismaService) {}

    async create(tenantId: string, name: string, description?: string, surveyType?: string, externalSurveyUrl?: string, cooldownDays?: number) {
        return this.prisma.campaign.create({
            data: {
                name,
                description,
                status: 'DRAFT',
                surveyType: surveyType || 'INTERNAL',
                externalSurveyUrl: externalSurveyUrl || null,
                ...(cooldownDays !== undefined && { cooldownDays }),
                tenantId
            }
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.campaign.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { leads: true, interactions: true }
                }
            }
        });
    }

    async findOne(tenantId: string, id: string) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id, tenantId },
            include: {
                surveys: true,
                _count: {
                    select: { leads: true, interactions: true }
                }
            }
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found or not owned by your tenant');
        }

        return campaign;
    }

    async update(tenantId: string, id: string, name?: string, description?: string, status?: string, surveyType?: string, externalSurveyUrl?: string, cooldownDays?: number) {
        // Enforce owner verification
        await this.findOne(tenantId, id);

        return this.prisma.campaign.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(surveyType && { surveyType }),
                ...(externalSurveyUrl !== undefined && { externalSurveyUrl }),
                ...(cooldownDays !== undefined && { cooldownDays }),
            }
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);

        // Delete cascade helper or transaction delete
        return this.prisma.$transaction(async (tx) => {
            // Unlink leads or delete them
            await tx.interaction.deleteMany({ where: { campaignId: id } });
            await tx.lead.deleteMany({ where: { campaignId: id } });
            await tx.survey.deleteMany({ where: { campaignId: id } });
            return tx.campaign.delete({ where: { id } });
        });
    }
}
