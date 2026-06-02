const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetLeads() {
  const campaignId = "15aa8ded-4380-4c21-a0a5-2305a2c9ee3b";
  const result = await prisma.lead.updateMany({
    where: { campaignId: campaignId },
    data: { status: 'NEW' }
  });
  console.log(`Updated ${result.count} leads to NEW status.`);
}

resetLeads()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
