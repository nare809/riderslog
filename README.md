# Riders Log - Backend API

Production-ready backend for the Riders Log car portal. This API is responsible exclusively for serving data, specifications, and images via a high-performance NestJS application using Supabase (PostgreSQL) and Cloudflare R2.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup Environment Variables
# Copy .env.example to .env and fill in your Supabase and R2 credentials.

# 3. Setup Database
npx prisma generate
npx prisma db push

# 4. Start Production Server
npm run build
npm run start:prod
```

API available at: `http://localhost:3000/api`

---

## 🏗️ Architecture

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Storage**: Cloudflare R2 (S3 Compatible)
- **Image Proxy**: Optimized NestJS controller proxing R2 bucket

---

## 🔧 Deployment Commands

- `npm run build`: Compile the application
- `npm run start:prod`: Start the optimized production server
- `npm run db:check`: Health check for database connection (Use this in your deployment pipeline)

---

## 🔌 API Summary

### Core Endpoints (/api)
- `GET /brands`: List all car brands
- `GET /cars`: List all filtered car models
- `GET /cars/:slug`: Detailed specs for a car model
- `GET /images/*`: High-performance image proxy

> **Note:** Data acquisition and scraping tools have been moved to the `scraper` project.
