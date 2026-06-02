import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const devices = await prisma.device.findMany();
    console.log(devices);
}
main().finally(() => prisma.$disconnect());
