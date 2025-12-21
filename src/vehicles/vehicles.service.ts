import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VehiclesService {

    // 1. Get all brands
    async getBrands() {
        return await prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async getBrandBySlug(slug: string) {
        return await prisma.brand.findUnique({
            where: { slug },
            include: { models: true }
        });
    }

    // 2. Get all models
    async getAllModels() {
        return await prisma.model.findMany({
            include: { brand: true },
        });
    }

    // 2. Get a specific car model
    async getModelBySlug(slug: string) {
        const model = await prisma.model.findFirst({
            where: { slug: slug },
            include: {
                brand: true,
                variants: {
                    orderBy: { priceExShowroom: 'asc' }
                }
            },
        });

        if (!model) {
            throw new NotFoundException(`Car model with slug '${slug}' not found`);
        }

        return model;
    }

    // 3. RECOMMENDATION ENGINE (The "Perfect Car" Finder)
    async findPerfectCar(min: number, max: number, fuel?: string, trans?: string, type?: string) {
        // Build the filter object dynamically
        const whereClause: any = {
            priceExShowroom: {
                gte: min || 0,        // Default to 0 if empty
                lte: max || 20000000, // Default to 2 Crores if empty
            },
        };

        // Only add these filters if the user actually selected them
        if (fuel && fuel !== 'All') {
            whereClause.fuelType = { equals: fuel, mode: 'insensitive' }; // Case insensitive search
        }

        if (trans && trans !== 'All') {
            whereClause.transmission = { contains: trans, mode: 'insensitive' };
        }

        if (type && type !== 'All') {
            whereClause.model = {
                type: { equals: type, mode: 'insensitive' }
            };
        }

        return await prisma.variant.findMany({
            take: 5, // Limit results to top 5 matches
            where: whereClause,
            include: {
                model: {
                    include: { brand: true }
                }
            },
            orderBy: { priceExShowroom: 'asc' } // Show cheapest first
        });
    }
}