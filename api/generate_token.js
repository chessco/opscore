const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateToken() {
  const secret = process.env.JWT_SECRET || 'secretKey';
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("No operator found");
    return;
  }
  
  const payload = {
    username: user.email,
    sub: user.id,
    role: user.role,
    tenantId: user.tenantId
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '365d' });
  console.log("User Email:", user.email);
  console.log("JWT Token:\n" + token);
}

generateToken()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
