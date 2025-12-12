const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const modelSlug = process.argv[2];
const TARGET_URL = process.argv[3];

if (!modelSlug || !TARGET_URL) {
    console.error('❌ Error: Please provide model slug and URL');
    console.log('Usage: npm run scrapevariant-specific <model-slug> <url>');
    console.log('Example: npm run scrape wagon-r https://www.cardekho.com/maruti/wagon-r');
    process.exit(1);
}

// Extract brand from URL
let brandFromUrl = 'unknown';
try {
    const urlObj = new URL(TARGET_URL);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts[0] === 'carmodels' && pathParts.length >= 2) {
        brandFromUrl = pathParts[1].toLowerCase();
    } else if (pathParts.length >= 1) {
        brandFromUrl = pathParts[0].toLowerCase();
    }
} catch (error) {
    console.error('⚠️  Warning: Could not parse URL');
}

console.log(`\n🚗 Processing: ${modelSlug.toUpperCase()}`);
console.log(`🏭 Brand: ${brandFromUrl.toUpperCase()}`);
console.log(`🌐 URL: ${TARGET_URL}\n`);

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log(`📡 Fetching main page...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    // Scrape data from main page
    const carData = await page.evaluate((brand) => {
        const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
        const modelName = document.querySelector('h1')?.innerText?.trim() || "Unknown Model";

        // Scrape Colors
        const colorElements = document.querySelectorAll('.colorsul li, .colorSelector li, .color-options li');
        const colors = Array.from(colorElements).map(li => {
            const colorName = li.querySelector('img')?.getAttribute('alt') ||
                li.querySelector('a')?.getAttribute('title') ||
                "Unknown Color";
            const colorImage = li.querySelector('img')?.getAttribute('data-src') ||
                li.querySelector('img')?.getAttribute('src') || "";
            return { name: colorName, image: colorImage };
        });

        // Scrape Variants with their dedicated specs URLs
        const variantLinks = document.querySelectorAll('a.pricecolor');
        const variants = Array.from(variantLinks).map(link => {
            try {
                const variantName = link.innerText.trim();
                if (!variantName) return null;

                // Get the variant's dedicated specs URL
                const specsUrl = link.getAttribute('href');

                const container = link.closest('.gsc_row') || link.parentElement;
                const fullText = container ? container.innerText : '';

                let price = 0;
                const priceMatch = fullText.match(/₹\s*([\d.,]+)\s*Lakh/i);
                if (priceMatch) {
                    price = parseFloat(priceMatch[1].replace(/,/g, '')) * 100000;
                }

                const detailsMatch = fullText.match(/(\d+)\s*cc[,\s]+(Manual|Automatic|AMT|iMT|DCA|AT)[,\s]+(Petrol|Diesel|CNG|Electric)/i);

                let engineCC = '';
                let transmission = 'Manual';
                let fuelType = 'Petrol';

                if (detailsMatch) {
                    engineCC = detailsMatch[1] + ' cc';
                    transmission = /Automatic|AMT|DCA|AT/i.test(detailsMatch[2]) ? 'Automatic' : 'Manual';
                    fuelType = detailsMatch[3];
                } else {
                    if (/Diesel/i.test(fullText)) fuelType = 'Diesel';
                    else if (/CNG/i.test(fullText)) fuelType = 'CNG';
                    else if (/Electric/i.test(fullText)) fuelType = 'Electric';
                    if (/Automatic|AMT|DCA|AT/i.test(fullText)) transmission = 'Automatic';
                    const ccMatch = fullText.match(/(\d{3,4})\s*cc/i);
                    if (ccMatch) engineCC = ccMatch[1] + ' cc';
                }

                const mileageMatch = fullText.match(/([\d.]+)\s*km/i);
                const mileage = mileageMatch ? mileageMatch[0] : fuelType;

                return {
                    name: variantName,
                    priceExShowroom: price,
                    fuelType: fuelType,
                    transmission: transmission,
                    specsUrl: specsUrl,
                    specs: {
                        raw_details: `${engineCC}, ${transmission}, ${fuelType}`,
                        engine_cc: engineCC,
                        mileage: mileage
                    },
                    colors: colors
                };
            } catch (error) {
                return null;
            }
        }).filter(v => v !== null && v.priceExShowroom > 0);

        let type = 'SUV';
        const modelLower = modelName.toLowerCase();
        if (modelLower.includes('sedan')) type = 'Sedan';
        else if (modelLower.includes('hatchback') || modelLower.includes('altroz') ||
            modelLower.includes('swift') || modelLower.includes('wagon')) type = 'Hatchback';

        return {
            brand_name: brandName,
            brand_slug: brandName.toLowerCase(),
            model_name: modelName,
            model_slug: brandName.toLowerCase() + '-' + modelName.toLowerCase().replace(brandName.toLowerCase() + ' ', '').replace(/\s+/g, '-'),
            type: type,
            variants: variants
        };
    }, brandFromUrl);

    console.log(`✅ Scraped ${carData.variants.length} variants\n`);

    // Extract variant-specific specifications by navigating to each variant's specs URL
    console.log(`📋 Extracting variant-specific specifications...`);

    for (let i = 0; i < carData.variants.length; i++) {
        const variant = carData.variants[i];

        if (!variant.specsUrl) {
            console.log(`   ⚠️  No specs URL for: ${variant.name}`);
            continue;
        }

        try {
            // Build full URL
            const fullSpecsUrl = variant.specsUrl.startsWith('http') ?
                variant.specsUrl :
                `https://www.cardekho.com${variant.specsUrl}`;

            console.log(`   ${i + 1}/${carData.variants.length}: ${variant.name}`);

            // Navigate to variant's dedicated specs page
            await page.goto(fullSpecsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Extract specifications
            const specs = await page.evaluate(() => {
                const specsData = {};
                const tables = document.querySelectorAll('table');

                tables.forEach(table => {
                    let heading = '';
                    let prev = table.previousElementSibling;
                    while (prev && !heading) {
                        const text = (prev.innerText || prev.textContent || '').trim();
                        if (text && text.length < 100 && (prev.tagName === 'H2' || prev.tagName === 'H3' || prev.tagName === 'DIV')) {
                            heading = text;
                            break;
                        }
                        prev = prev.previousElementSibling;
                    }

                    const rows = table.querySelectorAll('tr');
                    const sectionData = {};

                    rows.forEach(tr => {
                        const cells = tr.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const key = cells[0].innerText.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            let value = cells[1].innerText.trim();

                            // Get cell HTML and element for comprehensive checking
                            const cellHtml = cells[1].innerHTML.toLowerCase();
                            const cell = cells[1];

                            // Check for checkmarks in multiple ways:
                            // 1. Text-based RIGHT tick marks (✓ = available)
                            const hasTextCheck = value === '✓' || value === '✔' ||
                                cellHtml.includes('✓') || cellHtml.includes('✔');

                            // 2. Text-based WRONG tick marks (✗ = not available)
                            const hasWrongTick = value === '✗' || value === '✘' || value === '❌' ||
                                cellHtml.includes('✗') || cellHtml.includes('✘') ||
                                cellHtml.includes('❌') || cellHtml.includes('cross') ||
                                cellHtml.includes('wrong') || cellHtml.includes('no-');

                            // 3. Icon/Image detection - check if it's a check or cross icon
                            const imgElement = cell.querySelector('img');
                            const svgElement = cell.querySelector('svg');
                            const iconElement = cell.querySelector('i');

                            // Check if icon indicates a cross/X (not available)
                            // CardDekho specifically uses <i class="icon-deletearrow"></i> for X marks
                            const hasIconCross = (imgElement && (
                                (imgElement.src && (imgElement.src.includes('cross') || imgElement.src.includes('no') || imgElement.src.includes('wrong') || imgElement.src.includes('delete'))) ||
                                (imgElement.alt && (imgElement.alt.includes('cross') || imgElement.alt.includes('no') || imgElement.alt.includes('Not'))) ||
                                (imgElement.className && (imgElement.className.includes('cross') || imgElement.className.includes('delete')))
                            )) ||
                                (svgElement && (svgElement.className && (svgElement.className.includes('cross') || svgElement.className.includes('delete')))) ||
                                (iconElement && (iconElement.className && (
                                    iconElement.className.includes('icon-deletearrow') ||  // CardDekho's X mark!
                                    iconElement.className.includes('cross') ||
                                    iconElement.className.includes('times') ||
                                    iconElement.className.includes('close') ||
                                    iconElement.className.includes('delete')
                                ))) ||
                                cellHtml.includes('icon-deletearrow') ||  // Also check HTML
                                cellHtml.includes('icon-cross') ||
                                cellHtml.includes('icon-no') ||
                                cellHtml.includes('icon-wrong');

                            // Check if icon indicates a checkmark (available)
                            const hasIconCheck = !hasIconCross && (
                                (imgElement !== null) ||
                                (svgElement !== null) ||
                                (iconElement !== null) ||
                                cellHtml.includes('check') ||
                                cellHtml.includes('tick')
                            );

                            // 4. Specific indicator words
                            const hasYesWord = value === 'Yes' || value === 'Available' || value === 'Standard';
                            const hasNoWord = value === 'No' || value === 'Not Available' || value === 'Unavailable';

                            // Convert to boolean or null based on indicators
                            if (hasTextCheck || hasIconCheck || hasYesWord) {
                                value = true;
                            } else if (hasWrongTick || hasIconCross || hasNoWord) {
                                value = false;
                            } else if (value === '-' || value === 'NA' || value === 'N/A' || value === '--' || value === '') {
                                value = null;
                            }
                            // Keep other values as-is (like "6 airbags", "Front & Rear", etc.)

                            if (key) sectionData[key] = value;
                        }
                    });

                    if (Object.keys(sectionData).length > 0 && heading) {
                        const sectionKey = heading.toLowerCase().replace(/\s+|&/g, '_').replace(/[^a-z0-9_]/g, '');
                        specsData[sectionKey] = sectionData;
                    }
                });

                return specsData;
            });

            // Merge specs into variant
            carData.variants[i].specs = {
                ...variant.specs,
                ...specs
            };

            // Remove specsUrl from final output
            delete carData.variants[i].specsUrl;

        } catch (error) {
            console.log(`   ⚠️  Error loading specs for ${variant.name}: ${error.message}`);
        }
    }

    console.log(`\n✅ Extracted specs for ${carData.variants.length} variants`);

    await browser.close();

    // Save output
    const outputPath = path.join(__dirname, `../data/${modelSlug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(carData, null, 2), 'utf8');

    console.log(`\n✅ Complete! Data saved to ${modelSlug}.json`);
    console.log(`📦 Total variants: ${carData.variants.length}`);
    console.log(`\n✨ Ready for seeding: npm run seed:model ${modelSlug}`);

})();
