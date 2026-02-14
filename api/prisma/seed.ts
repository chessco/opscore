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
        },
    });

    console.log({ tenant });

    // Create Admin User
    const password = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            fullName: 'Admin User',
            password,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
        },
    });

    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
