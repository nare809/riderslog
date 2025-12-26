import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get slug from command line arguments
    const slug = process.argv[2];

    if (!slug) {
        console.error('❌ Please provide a model slug.');
        console.error('Usage: npx ts-node scripts/query-model.ts <slug>');
        console.error('Example: npx ts-node scripts/query-model.ts maruti-ertiga');
        process.exit(1);
    }

    console.log(`🔍 Searching for model: "${slug}"...`);

    const model = await prisma.model.findFirst({
        where: { slug: slug },
        include: {
            brand: true,
            variants: true
        }
    });

    if (!model) {
        console.error(`❌ Model not found with slug: "${slug}"`);
    } else {
        console.log('\n✅ Model Found:');
        console.log('--------------------------------------------------');
        console.log(`ID:           ${model.id}`);
        console.log(`Name:         ${model.name}`);
        console.log(`Brand:        ${model.brand.name}`);
        console.log(`Type:         ${model.type}`);
        console.log(`Main Image:   ${model.mainImageUrl}`);
        console.log(`Total Images: ${(model.images as any[])?.length || 0}`);
        console.log(`Variants:     ${model.variants.length}`);

        if (model.variants.length > 0) {
            console.log('\n--- Variant Prices ---');
            model.variants.slice(0, 5).forEach(v => {
                console.log(`- ${v.name}: ₹${v.priceExShowroom}`);
            });
            if (model.variants.length > 5) console.log(`... and ${model.variants.length - 5} more`);
        }
        console.log('--------------------------------------------------');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
