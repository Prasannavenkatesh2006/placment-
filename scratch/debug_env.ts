import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log('--- Environment Check ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'EXISTS' : 'MISSING');

try {
  const prisma = new PrismaClient();
  console.log('Prisma Client Initialized Successfully');
} catch (error) {
  console.error('Prisma Initialization Failed:', error);
}
