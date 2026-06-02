import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!user) throw new Error('No admin user');

        const lead = await prisma.lead.findFirst();
        if (!lead) throw new Error('No leads available');

        console.log('Dialing lead:', lead.id);

        const dialRes = await fetch(`http://localhost:3008/dialer/test-dial/${lead.id}`, {
            method: 'GET'
        });
        const dialData = await dialRes.json();
        console.log('Dial response:', dialData);

    } catch (err: any) {
        console.error('Error:', err.message);
    }
}
main().finally(() => prisma.$disconnect());
