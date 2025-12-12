// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Attempting to connect to the database...');
    try {
        await prisma.$connect();
        console.log('✅ Connection successful!');

        // Run a simple query to verify execution
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Test query executed successfully:', result);

    } catch (error) {
        console.error('❌ Connection failed!');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
