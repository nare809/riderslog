# Backend Scripts

Utility scripts for the Riders Log backend.

## Available Scripts

### `scraper.js` - Auto-Extract Car Data from CardDekho

**Complete automated scraper** that extracts all car data including variant-specific specifications.

#### Usage

```bash
npm run scrape <model-slug> <cardekho-url>
```

#### What It Does

1. **Main Page Scraping**:
   - Extracts all variants with names and prices
   - Captures each variant's dedicated specs URL
   - Extracts all available colors with names (from img alt attributes)
   - Detects fuel type and transmission

2. **Variant-Specific Specs Extraction**:
   - Navigates to each variant's `/overview/.../variant-name.htm#specification` page
   - Extracts complete specifications from all tables:
     - Engine & Transmission
     - Fuel & Performance
     - Dimensions & Capacity
     - Suspension, Steering & Brakes
     - Comfort & Convenience
     - Safety Features
     - Entertainment & Communication
     - Interior & Exterior
     - Advanced Safety Features

3. **Output**:
   - Saves complete data to `data/<model-slug>.json`
   - Ready for database seeding (no merge needed!)

#### Examples

```bash
# Maruti cars
npm run scrape wagon-r https://www.cardekho.com/maruti/wagon-r
npm run scrape swift https://www.cardekho.com/maruti/swift
npm run scrape baleno https://www.cardekho.com/maruti/baleno

# Tata cars
npm run scrape nexon https://www.cardekho.com/tata/nexon
npm run scrape punch https://www.cardekho.com/tata/punch
npm run scrape altroz https://www.cardekho.com/tata/altroz

# Hyundai cars
npm run scrape creta https://www.cardekho.com/hyundai/creta
npm run scrape venue https://www.cardekho.com/hyundai/venue
```

#### Features

✅ **Fully Automatic**: No manual JSON creation needed  
✅ **Variant-Specific**: Each variant gets its own complete specs  
✅ **Color Extraction**: Actual color names from images  
✅ **Brand Detection**: Auto-detects brand from URL  
✅ **Slug Generation**: Creates proper model slugs (e.g., `maruti-wagon-r`)  
✅ **Production Ready**: Handles errors gracefully

#### Output Structure

```json
{
  "brand_name": "Maruti",
  "brand_slug": "maruti",
  "model_name": "Maruti Wagon R",
  "model_slug": "maruti-wagon-r",
  "type": "Hatchback",
  "variants": [
    {
      "name": "Wagon R LXI",
      "priceExShowroom": 499000,
      "fuelType": "Petrol",
      "transmission": "Manual",
      "specs": {
        "raw_details": "998 cc, Manual, Petrol",
        "engine_cc": "998 cc",
        "mileage": "24.35 km",
        "engine___transmission": {
          "engine_type": "K10C",
          "displacement": "998 cc",
          "max_power": "65.71bhp@5500rpm",
          ...
        },
        "fuel___performance": {...},
        "dimensions___capacity": {...},
        "suspension_steering___brakes": {...},
        "comfort___convenience": {...},
        "safety": {...},
        "entertainment___communication": {...}
      },
      "colors": [
        {
          "name": "Pearl Metallic Nutmeg Brown",
          "image": "https://stimg.cardekho.com/..."
        }
      ]
    }
  ]
}
```

#### Next Step

After scraping, seed the data to database:

```bash
npm run seed:model <model-slug>
```

---

### `check-db.ts` - Database Health Check

Verifies database connection and shows table counts.

#### Usage

```bash
npm run db:check
```

#### Output

```
✅ Database connected!
📊 Brands: 3
📊 Models: 15
📊 Variants: 87
```

---

## Complete Workflow

### Adding a New Car Model

```bash
# Step 1: Scrape from CardDekho (auto-extracts everything)
npm run scrape nexon https://www.cardekho.com/tata/nexon

# Step 2: Seed to database
npm run seed:model nexon

# Done! Check via API
curl http://localhost:3000/api/tata-nexon
```

---

## Technical Details

### Technologies

- **Puppeteer**: Headless browser automation
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe seeding scripts

### Scraper Architecture

1. **Main Page Load**: Loads CardDekho model page
2. **Variant Discovery**: Finds all variant links with `a.pricecolor`
3. **Specs URL Capture**: Gets each variant's dedicated specs URL
4. **Parallel Processing**: Navigates to each variant's specs page sequentially
5. **Table Extraction**: Extracts specifications from HTML tables
6. **Data Merging**: Combines all data into single JSON output

### Error Handling

- ✅ Validates URL before scraping
- ✅ Handles missing specs gracefully
- ✅ Continues on individual variant failures
- ✅ Clear error messages

---

## Troubleshooting

### Scraper Issues

**Problem**: "No variants found"
- Check if CardDekho URL is correct
- Verify model exists on CardDekho
- Try different URL format (e.g., `/carmodels/Brand/Model`)

**Problem**: "Specs extraction failed"
- Check internet connection
- CardDekho might have updated their HTML structure
- Open issue with screenshot

**Problem**: Colors show "Unknown Color"
- CardDekho might be using different color structure
- Scraper will still work, just won't have color names

### Seeding Issues

**Problem**: "Model JSON not found"
- Run scraper first: `npm run scrape <model> <url>`
- Check `data/` directory for output file

**Problem**: "Brand ID not found"
- Brand will be auto-created on first seed
- No action needed

---

## Development

### Modifying Scraper

Edit `scraper.js` to:
- Add new selectors for different page structures
- Extract additional data points
- Customize output format

### Testing

```bash
# Test scraper with a known model
npm run scrape wagon-r https://www.cardekho.com/maruti/wagon-r

# Verify output
cat data/wagon-r.json | jq '.variants[0].specs'
```

---

## Support

For issues:
1. Check main `README.md`
2. Review workflows in `.agent/workflows/`
3. Open issue with details
