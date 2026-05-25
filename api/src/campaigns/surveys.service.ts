import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SurveysService {
    constructor(private prisma: PrismaService) {}

    // Dynamic JSON schema validation helper
    private validateSurveySchema(schema: any) {
        if (!schema || typeof schema !== 'object') {
            throw new BadRequestException('Invalid schema: Must be a JSON object');
        }
        if (!Array.isArray(schema.steps)) {
            throw new BadRequestException('Invalid schema: steps must be a JSON array');
        }
        for (const step of schema.steps) {
            if (!step.id || !step.type || !step.question) {
                throw new BadRequestException(`Invalid step configuration: step must include id, type, and question`);
            }
        }
    }

    async create(tenantId: string, campaignId: string, title: string, schema: any) {
        // Enforce campaign exists and is owned by tenant
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId }
        });
        if (!campaign) {
            throw new NotFoundException('Target campaign not found or not owned by your tenant');
        }

        this.validateSurveySchema(schema);

        return this.prisma.survey.create({
            data: {
                title,
                schema: schema as any,
                isActive: true,
                tenantId,
                campaignId
            }
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.survey.findMany({
            where: { tenantId },
            include: { campaign: { select: { name: true } } }
        });
    }

    async findByCampaign(tenantId: string, campaignId: string) {
        return this.prisma.survey.findMany({
            where: { campaignId, tenantId }
        });
    }

    async findOne(tenantId: string, id: string) {
        const survey = await this.prisma.survey.findFirst({
            where: { id, tenantId },
            include: { campaign: true }
        });

        if (!survey) {
            throw new NotFoundException('Survey not found or not owned by your tenant');
        }

        return survey;
    }

    async update(tenantId: string, id: string, title?: string, schema?: any, isActive?: boolean) {
        await this.findOne(tenantId, id);

        if (schema) {
            this.validateSurveySchema(schema);
        }

        return this.prisma.survey.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(schema && { schema: schema as any }),
                ...(isActive !== undefined && { isActive })
            }
        });
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);

        return this.prisma.$transaction(async (tx) => {
            // Unlink interactions or delete them
            await tx.interaction.deleteMany({ where: { surveyId: id } });
            return tx.survey.delete({ where: { id } });
        });
    }
}
