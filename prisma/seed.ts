// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const dataDir = path.join(__dirname, '../data');

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Data directory not found: ${dataDir}`);
        return;
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    console.log(`📂 Found ${files.length} files in data directory.`);

    for (const file of files) {
        try {
            const filePath = path.join(dataDir, file);
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const carData = JSON.parse(rawData);

            console.log(`🚀 Starting import for ${carData.brand_name} ${carData.model_name}...`);

            // 2. Upsert Brand (Create if not exists)
            const brand = await prisma.brand.upsert({
                where: { slug: carData.brand_slug },
                update: {
                    logoUrl: `https://images.myrightcar.com/brands/${carData.brand_slug}.png`,
                    logoUrlDark: `https://images.myrightcar.com/brands/${carData.brand_slug}_dark.png`,
                },
                create: {
                    name: carData.brand_name,
                    slug: carData.brand_slug,
                    logoUrl: `https://images.myrightcar.com/brands/${carData.brand_slug}.png`,
                    logoUrlDark: `https://images.myrightcar.com/brands/${carData.brand_slug}_dark.png`,
                },
            });
            console.log(`✅ Brand: ${brand.name}`);

            // 3. Upsert Model
            const model = await prisma.model.upsert({
                where: {
                    brandId_slug: {
                        brandId: brand.id,
                        slug: carData.model_slug,
                    },
                },
                update: {
                    type: carData.type,
                    mainImageUrl: carData.mainImageUrl,
                    images: carData.images
                },
                create: {
                    name: carData.model_name,
                    slug: carData.model_slug,
                    type: carData.type,
                    mainImageUrl: carData.mainImageUrl,
                    images: carData.images,
                    brandId: brand.id,
                },
            });
            console.log(`✅ Model: ${model.name}`);

            // 4. Clear old variants to prevent duplicates during re-seeding
            await prisma.variant.deleteMany({
                where: { modelId: model.id },
            });

            // 5. Insert Variants
            console.log(`⏳ Inserting ${carData.variants.length} variants...`);

            for (const v of carData.variants) {
                await prisma.variant.create({
                    data: {
                        name: v.name,
                        priceExShowroom: v.priceExShowroom,
                        fuelType: v.fuelType,
                        transmission: v.transmission,
                        specs: v.specs,   // Saved as JSONB
                        colors: v.colors, // Saved as JSONB
                        modelId: model.id,
                    },
                });
            }
        } catch (error) {
            console.error(`❌ Error processing file ${file}:`, error);
        }
    }

    console.log(`🎉 Success! All data imported to AWS.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });