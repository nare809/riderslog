
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const SCRAPER_DATA_DIR = path.join(__dirname, '../../scraper/data');

async function main() {
    console.log('🚀 Starting sync from scraped data to database...');

    // Debug: Check database URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing in environment variables!');
        process.exit(1);
    }
    // console.log(`🔌 Database URL loaded: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);

    if (!fs.existsSync(SCRAPER_DATA_DIR)) {
        console.error(`❌ Scraper data directory not found at: ${SCRAPER_DATA_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(SCRAPER_DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON files to process.`);

    let processedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const filePath = path.join(SCRAPER_DATA_DIR, file);

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            // 1. Sync Brand
            const brand = await prisma.brand.upsert({
                where: { slug: data.brand_slug },
                update: {
                    name: data.brand_name,
                    // Optional: Update logos if available in JSON, else keep existing
                },
                create: {
                    name: data.brand_name,
                    slug: data.brand_slug,
                },
            });

            // 2. Sync Model
            const model = await prisma.model.upsert({
                where: {
                    brandId_slug: {
                        brandId: brand.id,
                        slug: data.model_slug
                    }
                },
                update: {
                    name: data.model_name,
                    type: data.type,
                },
                create: {
                    name: data.model_name,
                    slug: data.model_slug,
                    type: data.type,
                    brandId: brand.id,
                }
            });

            // 3. Sync Variants
            // Strategy: Clear existing variants for this model and re-insert.
            // This ensures we don't have stale variants (e.g. if a name changed or was removed).
            // This mirrors the reliable logic in seed.ts.
            await prisma.variant.deleteMany({
                where: { modelId: model.id }
            });

            if (data.variants && Array.isArray(data.variants)) {
                const variantsData = data.variants.map((v: any) => ({
                    name: v.name,
                    priceExShowroom: v.priceExShowroom || 0,
                    fuelType: v.fuelType || 'Unknown',
                    transmission: v.transmission || 'Unknown',
                    specs: v.specs || {},
                    colors: v.colors || [],
                    modelId: model.id
                }));

                if (variantsData.length > 0) {
                    await prisma.variant.createMany({
                        data: variantsData
                    });
                }
            }

            console.log(`✅ Synced: ${data.model_name} (${data.variants?.length || 0} variants)`);
            processedCount++;

        } catch (err) {
            console.error(`❌ Error processing ${file}:`, err);
            errorCount++;
        }
    }

    console.log(`\n🎉 Sync Complete!`);
    console.log(`Processed Models: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
