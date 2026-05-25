// @ts-nocheck
import 'dotenv/config'; // Load .env file
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Create default Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'default-tenant' },
        update: {},
        create: {
            name: 'Default Tenant',
            slug: 'default-tenant',
            active: true,
            language: 'es',
        },
    });

    console.log({ tenant });

    // Create Admin User
    const password = await bcrypt.hash('pitaya123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pitayacode.io' },
        update: {},
        create: {
            email: 'admin@pitayacode.io',
            fullName: 'Admin User',
            password,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
        },
    });

    console.log({ admin });

    // ==========================================
    // SEED CORE REGISTRIES & SUITES
    // ==========================================

    // 1. Register Campaigns Suite
    const suiteCampaigns = await prisma.suiteRegistry.upsert({
        where: { id: 'suite_campaigns' },
        update: {
            name: 'Campaigns Suite',
            description: 'Comprehensive interaction, outbound surveys, and active queue orchestration suite',
            isActive: true,
        },
        create: {
            id: 'suite_campaigns',
            name: 'Campaigns Suite',
            description: 'Comprehensive interaction, outbound surveys, and active queue orchestration suite',
            isActive: true,
        },
    });

    console.log({ suiteCampaigns });

    // 2. Register Composable Modules under Campaigns Suite
    const modulesToRegister = [
        {
            id: 'mod_surveys',
            suiteId: 'suite_campaigns',
            name: 'Surveys Module',
            description: 'JSON-driven dynamic surveys runtime engine',
        },
        {
            id: 'mod_leads',
            suiteId: 'suite_campaigns',
            name: 'Leads Module',
            description: 'Lead ingestion, segmentation, and dataset management module',
        },
        {
            id: 'mod_interactions',
            suiteId: 'suite_campaigns',
            name: 'Interactions Module',
            description: 'Realtime interactions workflow tracker and agent lifecycle orchestrator',
        },
        {
            id: 'mod_dialer',
            suiteId: 'suite_campaigns',
            name: 'Dialer Module',
            description: 'Preview and progressive dialer automation engine',
        },
        {
            id: 'mod_recordings',
            suiteId: 'suite_campaigns',
            name: 'Recordings Module',
            description: 'Enables encrypted call storage, S3 backups, and supervisor quality assurance audits',
        }
    ];

    for (const mod of modulesToRegister) {
        const moduleReg = await prisma.moduleRegistry.upsert({
            where: { id: mod.id },
            update: {
                name: mod.name,
                description: mod.description,
                isActive: true,
            },
            create: {
                id: mod.id,
                suiteId: mod.suiteId,
                name: mod.name,
                description: mod.description,
                isActive: true,
            },
        });
        console.log(`Registered Module: ${moduleReg.id}`);
    }

    // 3. Assign Campaigns Suite to Default Tenant
    const suiteAssignment = await prisma.tenantSuiteAssignment.upsert({
        where: { licenseKey: 'LIC-DEFAULT-CAMPAIGNS' },
        update: {
            expiresAt: new Date('2030-12-31T23:59:59Z'),
        },
        create: {
            tenantId: tenant.id,
            suiteId: 'suite_campaigns',
            licenseKey: 'LIC-DEFAULT-CAMPAIGNS',
            expiresAt: new Date('2030-12-31T23:59:59Z'),
        },
    });

    console.log({ suiteAssignment });

    // 4. Assign and Activate Modules for Default Tenant (MVP: Surveys, Leads, Interactions)
    const mvpModules = ['mod_surveys', 'mod_leads', 'mod_interactions', 'mod_dialer', 'mod_recordings'];
    for (const moduleId of mvpModules) {
        // Find existing module assignment
        const existingAssignment = await prisma.tenantModuleAssignment.findFirst({
            where: {
                tenantId: tenant.id,
                moduleId: moduleId,
            },
        });

        if (!existingAssignment) {
            const assignment = await prisma.tenantModuleAssignment.create({
                data: {
                    tenantId: tenant.id,
                    moduleId: moduleId,
                    isActive: true,
                },
            });
            console.log(`Assigned MVP Module to Tenant: ${assignment.moduleId}`);
        } else {
            console.log(`MVP Module already assigned: ${moduleId}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
