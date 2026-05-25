import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
    constructor(private prisma: PrismaService) {}

    // Get all suites and highlight which ones are active/assigned for this tenant
    async getTenantSuites(tenantId: string) {
        const suites = await this.prisma.suiteRegistry.findMany({
            where: { isActive: true },
            include: {
                suiteAssignments: {
                    where: { tenantId }
                }
            }
        });

        return suites.map(suite => ({
            id: suite.id,
            name: suite.name,
            description: suite.description,
            isAssigned: suite.suiteAssignments.length > 0,
            licenseKey: suite.suiteAssignments[0]?.licenseKey || null,
            expiresAt: suite.suiteAssignments[0]?.expiresAt || null,
        }));
    }

    // Get all modules and highlight which ones are active for this tenant
    async getTenantModules(tenantId: string) {
        // First find suites assigned to this tenant
        const assignments = await this.prisma.tenantSuiteAssignment.findMany({
            where: { tenantId }
        });
        const assignedSuiteIds = assignments.map(a => a.suiteId);

        // Fetch all modules belonging to assigned suites
        const modules = await this.prisma.moduleRegistry.findMany({
            where: {
                isActive: true,
                suiteId: { in: assignedSuiteIds }
            },
            include: {
                moduleAssignments: {
                    where: { tenantId }
                }
            }
        });

        return modules.map(mod => ({
            id: mod.id,
            suiteId: mod.suiteId,
            name: mod.name,
            description: mod.description,
            isActive: mod.moduleAssignments[0]?.isActive ?? false,
            isAssigned: mod.moduleAssignments.length > 0,
        }));
    }

    // Assign a suite to a tenant (SYSTEM role only)
    async assignSuite(tenantId: string, suiteId: string, licenseKey: string, expiresAt: Date) {
        // Validate tenant exists
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        // Validate suite exists
        const suite = await this.prisma.suiteRegistry.findUnique({ where: { id: suiteId } });
        if (!suite) throw new NotFoundException('Suite not found');

        return this.prisma.tenantSuiteAssignment.upsert({
            where: { licenseKey },
            update: {
                tenantId,
                suiteId,
                expiresAt,
            },
            create: {
                tenantId,
                suiteId,
                licenseKey,
                expiresAt,
            }
        });
    }

    // Assign/toggle module for a tenant
    async assignModule(tenantId: string, moduleId: string, isActive: boolean, actorRole: string) {
        // Validate module exists
        const mod = await this.prisma.moduleRegistry.findUnique({
            where: { id: moduleId },
            include: { suite: true }
        });
        if (!mod) throw new NotFoundException('Module not found');

        // Verify the suite is assigned to this tenant
        const suiteAssignment = await this.prisma.tenantSuiteAssignment.findFirst({
            where: {
                tenantId,
                suiteId: mod.suiteId
            }
        });
        if (!suiteAssignment) {
            throw new ForbiddenException('Suite containing this module is not licensed for this tenant');
        }

        // Only SYSTEM can create/delete/assign, but TENANT_ADMIN can toggle active/inactive if already assigned
        // For simplicity, we upsert the assignment status
        const existingAssignment = await this.prisma.tenantModuleAssignment.findFirst({
            where: {
                tenantId,
                moduleId
            }
        });

        if (existingAssignment) {
            // Both SYSTEM and TENANT_ADMIN can toggle existing module assignments
            return this.prisma.tenantModuleAssignment.update({
                where: { id: existingAssignment.id },
                data: { isActive }
            });
        } else {
            // Only SYSTEM can assign a new module for the first time
            if (actorRole !== 'SYSTEM' && actorRole !== 'ADMIN') { // ADMIN maps to TENANT_ADMIN backward compatibility
                throw new ForbiddenException('Only administrators can initialize new module assignments');
            }

            return this.prisma.tenantModuleAssignment.create({
                data: {
                    tenantId,
                    moduleId,
                    isActive
                }
            });
        }
    }

    // Check if a specific module is active for a tenant
    async isModuleActive(tenantId: string, moduleId: string): Promise<boolean> {
        const assignment = await this.prisma.tenantModuleAssignment.findFirst({
            where: {
                tenantId,
                moduleId,
                isActive: true
            }
        });
        return !!assignment;
    }
}
