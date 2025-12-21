// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Get model slug from command line arguments
const modelSlug = process.argv[2]; // e.g., 'altroz', 'sierra', 'nexon'

if (!modelSlug) {
    console.error('❌ Error: Please provide a model slug');
    console.log('Usage: ts-node seed-model.ts <model-slug>');
    console.log('Example: ts-node seed-model.ts altroz');
    process.exit(1);
}

async function seedModel() {
    console.log(`🌱 Starting ${modelSlug.toUpperCase()} database seeding...\n`);

    // Read complete data (scraped with all specs)
    const dataPath = path.join(__dirname, `../data/${modelSlug}.json`);

    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Error: ${modelSlug}.json not found!`);
        console.log(`💡 Please run: npm run scrape ${modelSlug} <url> first`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    try {
        // 1. Upsert Brand
        console.log(`📦 Upserting brand: ${data.brand_name}...`);
        const brand = await prisma.brand.upsert({
            where: { slug: data.brand_slug },
            update: { name: data.brand_name },
            create: {
                name: data.brand_name,
                slug: data.brand_slug
            }
        });
        console.log(`✅ Brand: ${brand.name} (ID: ${brand.id})\n`);

        // 2. Upsert Model
        console.log(`🚗 Upserting model: ${data.model_name}...`);
        const model = await prisma.model.upsert({
            where: {
                brandId_slug: {
                    brandId: brand.id,
                    slug: data.model_slug
                }
            },
            update: {
                name: data.model_name,
                type: data.type
            },
            create: {
                name: data.model_name,
                slug: data.model_slug,
                type: data.type,
                brandId: brand.id
            }
        });
        console.log(`✅ Model: ${model.name} (ID: ${model.id})\n`);

        // 3. Clear existing variants for this model (to prevent duplicates on re-run)
        console.log(`🧹 Cleaning existing ${data.model_name} variants...`);
        const deleted = await prisma.variant.deleteMany({
            where: { modelId: model.id }
        });
        console.log(`🗑️ Deleted ${deleted.count} existing variants\n`);

        // 4. Insert Variants
        console.log('📝 Inserting variants...');
        let count = 0;

        for (const variant of data.variants) {
            await prisma.variant.create({
                data: {
                    name: variant.name,
                    priceExShowroom: variant.priceExShowroom,
                    fuelType: variant.fuelType,
                    transmission: variant.transmission,
                    specs: variant.specs, // This includes merged technical specs & features
                    colors: variant.colors,
                    modelId: model.id
                }
            });
            count++;
            process.stdout.write(`  ✓ ${count}/${data.variants.length} variants inserted\r`);
        }
        console.log(`\n✅ Successfully inserted ${count} variants!\n`);

        // 5. Summary
        const priceRange = data.variants.map((v: any) => v.priceExShowroom);
        const minPrice = Math.min(...priceRange);
        const maxPrice = Math.max(...priceRange);

        console.log('📊 Summary:');
        console.log(`  Brand: ${brand.name}`);
        console.log(`  Model: ${model.name} (${model.type})`);
        console.log(`  Variants: ${count}`);
        console.log(`  Price Range: ₹${(minPrice / 100000).toFixed(2)}L - ₹${(maxPrice / 100000).toFixed(2)}L`);
        console.log(`  Fuel Types: ${[...new Set(data.variants.map((v: any) => v.fuelType))].join(', ')}`);
        console.log(`  Transmissions: ${[...new Set(data.variants.map((v: any) => v.transmission))].join(', ')}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedModel()
    .then(() => {
        console.log(`\n🎉 ${modelSlug.toUpperCase()} seeding complete!`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`Failed to seed ${modelSlug}:`, error);
        process.exit(1);
    });
