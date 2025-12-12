# Riders Log - Backend API

Complete backend documentation for the Riders Log car portal - a comprehensive car database API with automated data extraction from CardDekho.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run start:dev

# API available at: http://localhost:3000
```

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Workflows](#workflows)
- [Scripts](#scripts)
- [Environment Setup](#environment-setup)
- [Usage Examples](#usage-examples)

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Web Scraping**: Puppeteer
- **Runtime**: Node.js

### Project Structure

```
backend/
├── src/
│   ├── vehicles/          # Public API (car data)
│   ├── admin/             # Admin API (CRUD operations)
│   ├── app.module.ts      # Main module
│   └── main.ts            # Entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed-model.ts      # Seeding script
├── scripts/
│   ├── scraper.js         # CardDekho scraper
│   └── check-db.ts        # Database utility
├── data/                  # Scraped car data (JSON)
└── .agent/workflows/      # Workflow documentation
```

---

## 🗄️ Database Schema

### Entity Relationship

```
Brand (Maruti, Tata, Hyundai)
  ↓ 1:N
Model (Wagon R, Nexon, Creta)
  ↓ 1:N
Variant (LXI, VXI, ZXI)
```

### Tables

#### Brand
```sql
- id: Int (PK, auto-increment)
- name: String (unique) - e.g., "Maruti"
- slug: String (unique) - e.g., "maruti"
- createdAt: DateTime
```

#### Model
```sql
- id: Int (PK, auto-increment)
- name: String - e.g., "Wagon R"
- slug: String - e.g., "maruti-wagon-r"
- type: String - e.g., "Hatchback", "SUV", "Sedan"
- brandId: Int (FK → Brand)
- unique(brandId, slug)
```

#### Variant
```sql
- id: Int (PK, auto-increment)
- name: String - e.g., "Wagon R LXI"
- priceExShowroom: Float - in rupees
- fuelType: String - "Petrol", "Diesel", "CNG", "Electric"
- transmission: String - "Manual", "Automatic"
- specs: JSON - Complete technical specifications
- colors: JSON - Available colors with images
- modelId: Int (FK → Model)
- createdAt: DateTime
```

---

## 🔌 API Endpoints

### Public API (`/api`)

Base URL: `http://localhost:3000/api`

#### 1. Get All Brands

```http
GET /brands
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Maruti",
    "slug": "maruti",
    "models": [...]
  }
]
```

#### 2. Get Brand by Slug

```http
GET /brands/:slug
```

**Example:**
```bash
GET /brands/maruti
```

**Response:**
```json
{
  "id": 1,
  "name": "Maruti",
  "slug": "maruti",
  "models": [
```http
GET /brands/:slug
```

**Response:**
```json
{
  "id": 1,
  "name": "Maruti",
  "slug": "maruti",
  "models": [...]
}
```

#### 3. Get All Car Models
```http
GET /cars
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Maruti Wagon R",
    "slug": "maruti-wagon-r",
    "type": "Hatchback",
    "brand": {...},
    "variants": [...]
  }
]
```

#### 4. Get Car Model by Slug
```http
GET /cars/:slug
```

**Example:** `GET /cars/maruti-wagon-r`

**Response:**
```json
{
  "id": 1,
  "name": "Maruti Wagon R",
  "slug": "maruti-wagon-r",
  "type": "Hatchback",
  "brand": {
    "id": 1,
    "name": "Maruti",
    "slug": "maruti"
  },
  "variants": [
    {
      "id": 1,
      "name": "Wagon R LXI",
      "priceExShowroom": 499000,
      "fuelType": "Petrol",
      "transmission": "Manual",
      "specs": {
        "engine___transmission": {
          "engine_type": "K10C",
          "displacement": "998 cc",
          "max_power": "65.71bhp@5500rpm"
        },
        "fuel___performance": {...},
        "dimensions___capacity": {...}
      },
      "colors": [
        { "name": "Pearl Metallic Nutmeg Brown", "image": "..." }
      ]
    }
  ]
}
```

#### 5. Car Recommendations
```http
GET /cars/recommend?min=500000&max=1500000&fuel=Diesel
```

**Query Parameters:**
- `min` - Minimum price
- `max` - Maximum price
- `fuel` - Fuel type (Petrol, Diesel, CNG)
- `trans` - Transmission (Manual, Automatic)
- `type` - Vehicle type (Hatchback, SUV, Sedan, etc.)

**Example:**
```bash
GET /api/recommend?min=500000&max=1000000&fuel=Petrol
```

**Response:**
```json
[
  {
    "variant": {
      "name": "Wagon R LXI",
      "priceExShowroom": 499000,
      "fuelType": "Petrol",
      "specs": {...}
    },
    "model": {
      "name": "Maruti Wagon R",
      "slug": "maruti-wagon-r",
      "type": "Hatchback"
    },
    "brand": {
      "name": "Maruti",
      "slug": "maruti"
    }
  }
]
```

---

### Admin API (`/admin`)

Base URL: `http://localhost:3000/admin`

**Authentication**: Requires `x-admin-key` header

```bash
x-admin-key: your-secret-admin-key
```

#### BRAND MANAGEMENT

**1. List All Brands**
```http
GET /admin/brands
```

**2. Get Brand by ID**
```http
GET /admin/brands/:id
```
**Response:**
```json
{
  "id": 1,
  "name": "Maruti",
  "slug": "maruti",
  "models": [
    {
      "id": 1,
      "name": "Wagon R",
      "variants": [...]
    }
  ]
}
```

**3. Create Brand**
```http
POST /admin/brands
```
**Body:**
```json
{
  "name": "Mahindra",
  "slug": "mahindra"
}
```

**4. Update Brand**
```http
PUT /admin/brands/:id
```
**Body:**
```json
{
  "name": "Mahindra & Mahindra",
  "slug": "mahindra"
}
```

**5. Delete Brand**
```http
DELETE /admin/brands/:id
```
*Note: Deletes all models and variants under this brand (cascade delete)*

---

#### MODEL MANAGEMENT

**1. List All Models**
```http
GET /admin/cars
```

**Response:**
```json
[
  { 
    "id": 1, 
    "name": "Maruti Wagon R", 
    "slug": "maruti-wagon-r",
    "type": "Hatchback",
    "brand": { "name": "Maruti" },
    "variants": [...]
  }
]
```

**2. Get Model by ID**
```http
GET /admin/cars/:id
```
**Response:**
```json
{
  "id": 20,
  "name": "Maruti Wagon R",
  "slug": "maruti-wagon-r",
  "type": "Hatchback",
  "brand": {
    "id": 1,
    "name": "Maruti",
    "slug": "maruti"
  },
  "variants": [...]
}
```

**3. Create Model**
```http
POST /admin/cars
```
**Body:**
```json
{
  "name": "Wagon R",
  "slug": "maruti-wagon-r",
  "type": "Hatchback",
  "brandId": 1
}
```

**4. Update Model**
```http
PUT /admin/cars/:id
```
**Body:**
```json
{
  "name": "Wagon R 2024",
  "slug": "maruti-wagon-r-2024",
  "type": "Hatchback"
}
```

**5. Delete Model**
```http
DELETE /admin/cars/:id
```
*Note: Deletes all variants under this model (cascade delete)*

---

#### VARIANT MANAGEMENT

**1. List All Variants**
```http
GET /admin/variants
```

**2. Get Variant by ID**
```http
GET /admin/variants/:id
```
**Response:**
```json
{
  "id": 50,
  "name": "Wagon R LXI",
  "priceExShowroom": 499000,
  "fuelType": "Petrol",
  "transmission": "Manual",
  "specs": {...},
  "colors": [...],
  "model": {
    "id": 1,
    "name": "Maruti Wagon R",
    "brand": {
      "id": 1,
      "name": "Maruti"
    }
  }
}
```

**3. Create Variant**
```http
POST /admin/variants
```
**Body:**
```json
{
  "name": "Wagon R LXI CNG",
  "priceExShowroom": 550000,
  "fuelType": "CNG",
  "transmission": "Manual",
  "specs": {...},
  "colors": [...],
  "modelId": 1
}
```

**3. Update Variant Price (Quick Update)**
```http
PATCH /admin/variants/:id/price
```
**Body:**
```json
{
  "price": 525000
}
```

**4. Update Variant (Complete Update)**
```http
PUT /admin/variants/:id
```
**Body:**
```json
{
  "name": "Wagon R LXI CNG Updated",
  "priceExShowroom": 560000,
  "fuelType": "CNG",
  "transmission": "Manual",
  "specs": {...},
  "colors": [...]
}
```

**5. Delete Variant**
```http
DELETE /admin/variants/:id
```


---

## ⚙️ Workflows

### Workflow 1: Add New Car Model

**Complete 2-step process to add any car to the database**

#### Step 1: Scrape Data

```bash
npm run scrape <model-slug> <cardekho-url>
```

**What it does:**
1. Scrapes all variants from CardDekho main page
2. Navigates to each variant's dedicated specs page
3. Extracts complete variant-specific specifications
4. Saves to `data/<model-slug>.json`

**Examples:**
```bash
# Maruti models
npm run scrape wagon-r https://www.cardekho.com/maruti/wagon-r
npm run scrape swift https://www.cardekho.com/maruti/swift

# Tata models
npm run scrape nexon https://www.cardekho.com/tata/nexon
npm run scrape punch https://www.cardekho.com/tata/punch

# Hyundai models
npm run scrape creta https://www.cardekho.com/hyundai/creta
```

#### Step 2: Seed Database

```bash
npm run seed:model <model-slug>
```

**What it does:**
1. Reads `data/<model-slug>.json`
2. Upserts Brand
3. Upserts Model
4. Inserts all Variants

**Examples:**
```bash
npm run seed:model wagon-r
npm run seed:model nexon
```

### Complete Example

```bash
# Add Tata Nexon to database
npm run scrape nexon https://www.cardekho.com/tata/nexon
npm run seed:model nexon

# Done! Nexon is now in the database
```

---

## 📜 Scripts

### Development

```bash
# Start development server (watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Database

```bash
# Check database connection and table counts
npm run db:check

# Run Prisma migrations
npx prisma migrate dev

# Open Prisma Studio (GUI)
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Data Management

```bash
# Scrape car data from CardDekho
npm run scrape <model-slug> <url>

# Seed specific model to database
npm run seed:model <model-slug>
```

---

## 🛠️ Environment Setup

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd riders-log/backend

# Install dependencies
npm install
```

### 3. Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/riderslog"

# Server
PORT=3000

# Admin
ADMIN_KEY=your-secret-admin-key-here
```

### 4. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed initial data
npm run scrape wagon-r https://www.cardekho.com/maruti/wagon-r
npm run seed:model wagon-r
```

### 5. Start Server

```bash
npm run start:dev
```

Visit: `http://localhost:3000/api/brands`

---

## 💡 Usage Examples

### Example 1: Get All Maruti Cars

```bash
curl http://localhost:3000/api/brands/maruti
```

### Example 2: Find Hatchbacks Under 10 Lakhs

```bash
curl "http://localhost:3000/api/recommend?max=1000000&type=Hatchback"
```

### Example 3: Get Wagon R Details

```bash
curl http://localhost:3000/api/maruti-wagon-r
```

### Example 4: Add New Model (Complete Workflow)

```bash
# 1. Scrape from CardDekho
npm run scrape altroz https://www.cardekho.com/tata/altroz

# 2. Seed to database
npm run seed:model altroz

# 3. Verify via API
curl http://localhost:3000/api/tata-altroz
```

### Example 5: Update Price (Admin)

```bash
curl -X PATCH http://localhost:3000/admin/variants/1/price \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-secret-key" \
  -d '{"price": 525000}'
```

---

## 📊 Data Structure

### Variant Specs (JSON)

Each variant contains complete specifications in JSON format:

```json
{
  "raw_details": "998 cc, Manual, Petrol",
  "engine_cc": "998 cc",
  "mileage": "24.35 km",
  "engine___transmission": {
    "engine_type": "K10C",
    "displacement": "998 cc",
    "max_power": "65.71bhp@5500rpm",
    "max_torque": "89Nm@3500rpm",
    "transmission_type": "Manual",
    "gearbox": "5-Speed"
  },
  "fuel___performance": {
    "fuel_type": "Petrol",
    "petrol_mileage_arai": "24.35 kmpl",
    "petrol_fuel_tank_capacity": "32 Litres"
  },
  "dimensions___capacity": {
    "length": "3655 mm",
    "width": "1620 mm",
    "height": "1675 mm",
    "seating_capacity": "5",
    "boot_space": "341 Litres"
  },
  "suspension_steering___brakes": {...},
  "comfort___convenience": {...},
  "safety": {...},
  "entertainment___communication": {...}
}
```

### Colors Array (JSON)

```json
[
  {
    "name": "Pearl Metallic Nutmeg Brown Color",
    "image": "https://stimg.cardekho.com/..."
  },
  {
    "name": "Metallic Silky Silver Color",
    "image": "https://stimg.cardekho.com/..."
  }
]
```

---

## 🚨 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Scraper Fails

```bash
# Check internet connection
# Verify CardDekho URL is correct
# Try with headless: false for debugging
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate
```

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [CardDekho](https://www.cardekho.com)

---

## 🤝 Contributing

1. Add new car model via scraper
2. Test API endpoints
3. Update documentation
4. Submit pull request

---

## 📝 License

MIT

---

## 👨‍💻 Support

For issues and questions:
- Check workflows: `.agent/workflows/`
- Review scripts: `scripts/README.md`
- API documentation: Above

---

**Built with ❤️ for car enthusiasts**
