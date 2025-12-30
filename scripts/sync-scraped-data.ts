import { PrismaClient } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '../../scraper/data');

async function main() {
    console.log('🔄 Starting Data Sync...');

    // Ensure 'Tata' brand exists (since many cars are Tata)
    // In a real scenario, we should upsert brands dynamically, but the scraper JSON has brand info.

    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📂 Found ${jsonFiles.length} JSON files.`);

    // Use a map to cache Brand IDs to avoid repeated DB calls
    const brandCache = new Map<string, number>();

    for (const file of jsonFiles) {
        const filePath = path.join(DATA_DIR, file);

        try {
            const data = await fs.readJson(filePath);

            // Basic validation
            if (!data.brand || !data.name || !data.slug) {
                console.warn(`⚠️ Skipping ${file}: Missing brand, name, or slug.`);
                continue;
            }

            const brandSlug = data.brand.slug;

            // 1. Upsert Brand
            let brandId = brandCache.get(brandSlug);

            if (!brandId) {
                const brand = await prisma.brand.upsert({
                    where: { slug: brandSlug },
                    update: {
                        name: data.brand.name,
                        logoUrl: data.brand.logoUrl,
                        logoUrlDark: data.brand.logoUrlDark
                    },
                    create: {
                        name: data.brand.name,
                        slug: brandSlug,
                        logoUrl: data.brand.logoUrl,
                        logoUrlDark: data.brand.logoUrlDark
                    }
                });
                brandId = brand.id;
                brandCache.set(brandSlug, brandId);
                // console.log(`✅ Brand Synced: ${brand.name}`);
            }

            // 2. Upsert Model
            // Clean up images. If it's an array (from new API), store directly. 
            // Schema expects `images` as Json? or String? 
            // Schema: `images Json?`

            const model = await prisma.model.upsert({
                where: {
                    brandId_slug: {
                        brandId: brandId,
                        slug: data.slug
                    }
                },
                update: {
                    name: data.name,
                    type: data.type,
                    mainImageUrl: data.mainImageUrl,
                    images: data.images // Pass the whole array/object
                },
                create: {
                    name: data.name,
                    slug: data.slug,
                    type: data.type,
                    mainImageUrl: data.mainImageUrl,
                    images: data.images,
                    brandId: brandId
                }
            });

            // 3. Sync Variants
            if (data.variants && Array.isArray(data.variants)) {
                for (const v of data.variants) {
                    // Unique constraint on Variant? 
                    // The schema doesn't have a unique constraint on Variant name/slug yet, just ID.
                    // We should probably try to find by name + modelId to avoid duplicates.

                    const existingVariant = await prisma.variant.findFirst({
                        where: {
                            modelId: model.id,
                            name: v.name
                        }
                    });

                    if (existingVariant) {
                        await prisma.variant.update({
                            where: { id: existingVariant.id },
                            data: {
                                priceExShowroom: v.priceExShowroom || 0,
                                fuelType: v.fuelType || 'Unknown',
                                transmission: v.transmission || 'Manual',
                                specs: v.specs || {},
                                colors: v.colors || []
                            }
                        });
                    } else {
                        await prisma.variant.create({
                            data: {
                                name: v.name,
                                priceExShowroom: v.priceExShowroom || 0,
                                fuelType: v.fuelType || 'Unknown',
                                transmission: v.transmission || 'Manual',
                                specs: v.specs || {},
                                colors: v.colors || [],
                                modelId: model.id
                            }
                        });
                    }
                }
            }

            process.stdout.write('.'); // Progress dot

        } catch (err) {
            console.error(`\n❌ Error processing ${file}:`, err.message);
        }
    }

    console.log('\n✨ Data Sync Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
