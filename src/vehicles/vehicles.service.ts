import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VehiclesService {

    // 1. Get all brands
    async getBrands() {
        return await prisma.brand.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { models: true }
                }
            }
        });
    }

    async getBrandBySlug(slug: string) {
        return await prisma.brand.findUnique({
            where: { slug },
            include: { models: true }
        });
    }

    async getBrandCars(
        brandSlug: string,
        priceMin?: number,
        priceMax?: number,
        sortBy?: string,
        bodyTypes?: string[],
        fuelTypes?: string[],
        transmissions?: string[],
        seatingCapacities?: string[],
        mileage?: string,
        electricRange?: string,
        driveTypes?: string[],
        safetyRating?: string
    ) {
        // First, get the brand to ensure it exists
        const brand = await prisma.brand.findUnique({
            where: { slug: brandSlug },
        });

        if (!brand) {
            throw new NotFoundException(`Brand '${brandSlug}' not found`);
        }

        // Build the where clause for variants
        const variantWhere: any = {};

        if (priceMin !== undefined || priceMax !== undefined) {
            variantWhere.priceExShowroom = {};
            if (priceMin !== undefined) variantWhere.priceExShowroom.gte = priceMin;
            if (priceMax !== undefined) variantWhere.priceExShowroom.lte = priceMax;
        }

        // Fuel Type filter
        if (fuelTypes && fuelTypes.length > 0) {
            variantWhere.fuelType = { in: fuelTypes };
        }

        // Transmission filter
        if (transmissions && transmissions.length > 0) {
            variantWhere.transmission = { in: transmissions };
        }

        // Build model-level where clause
        const modelWhere: any = {
            brandId: brand.id,
        };

        // Body Type filter
        if (bodyTypes && bodyTypes.length > 0) {
            modelWhere.type = { in: bodyTypes };
        }

        // Seating Capacity filter
        if (seatingCapacities && seatingCapacities.length > 0) {
            // Convert '5 Seater' to 5, '8+ Seater' to 8
            const seatNumbers = seatingCapacities.map(s => {
                const match = s.match(/\d+/);
                return match ? parseInt(match[0]) : null;
            }).filter(n => n !== null);

            if (seatNumbers.length > 0) {
                modelWhere.seatingCapacity = { in: seatNumbers };
            }
        }

        // Add variant filter if any variant-level filters exist
        if (Object.keys(variantWhere).length > 0) {
            modelWhere.variants = {
                some: variantWhere
            };
        }

        // Fetch models for this brand
        let models = await prisma.model.findMany({
            where: modelWhere,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                        logoUrlDark: true
                    }
                },
                variants: {
                    where: variantWhere,
                    orderBy: { priceExShowroom: 'asc' },
                    take: 1 // Get cheapest variant for display
                }
            },
            orderBy: { name: 'asc' } // Default alphabetical order
        });

        // Client-side filtering for complex filters (mileage, electric range, safety rating, drive type)
        models = models.filter(model => {
            // Mileage filter
            if (mileage && model.variants && model.variants.length > 0) {
                const minMileage = parseInt(mileage.replace('+', ''));
                const variantMileage = (model.variants[0].specs as any)?.mileage;
                if (variantMileage) {
                    const mileageValue = parseFloat(variantMileage.replace(/[^0-9.]/g, ''));
                    if (isNaN(mileageValue) || mileageValue < minMileage) {
                        return false;
                    }
                }
            }

            // Electric Range filter (for EVs)
            if (electricRange && model.variants && model.variants.length > 0) {
                const minRange = parseInt(electricRange.replace('+', ''));
                const variantRange = (model.variants[0].specs as any)?.range;
                if (variantRange) {
                    const rangeValue = parseFloat(variantRange.replace(/[^0-9.]/g, ''));
                    if (isNaN(rangeValue) || rangeValue < minRange) {
                        return false;
                    }
                }
            }

            // Drive Type filter
            if (driveTypes && driveTypes.length > 0 && model.variants && model.variants.length > 0) {
                const variantDriveType = (model.variants[0].specs as any)?.driveType;
                if (variantDriveType) {
                    const hasMatchingDrive = driveTypes.some(dt =>
                        variantDriveType.toLowerCase().includes(dt.toLowerCase().split(' ')[0])
                    );
                    if (!hasMatchingDrive) {
                        return false;
                    }
                }
            }

            // Safety Rating filter
            if (safetyRating && model.variants && model.variants.length > 0) {
                const minRating = parseInt(safetyRating.replace('+', ''));
                const variantRating = (model.variants[0].specs as any)?.safetyRating;
                if (variantRating) {
                    const ratingValue = parseInt(variantRating);
                    if (isNaN(ratingValue) || ratingValue < minRating) {
                        return false;
                    }
                }
            }

            return true;
        });

        // Apply manual sorting based on sortBy parameter
        if (sortBy === 'priceLow' || sortBy === 'priceHigh') {
            models = models.sort((a, b) => {
                const priceA = a.variants?.[0]?.priceExShowroom || 0;
                const priceB = b.variants?.[0]?.priceExShowroom || 0;
                return sortBy === 'priceLow' ? priceA - priceB : priceB - priceA;
            });
        }

        return {
            brand,
            cars: models,
            count: models.length
        };
    }

    // 2. Get all models
    async getAllModels() {
        return await prisma.model.findMany({
            include: {
                brand: true,
                variants: {
                    select: {
                        priceExShowroom: true,
                        fuelType: true,
                        transmission: true,
                        specs: true
                    }
                }
            },
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