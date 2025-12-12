import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateVariantDto } from './dto/create-variant.dto';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {

    // ========== BRAND MANAGEMENT ==========

    // Get all brands
    async getAllBrands() {
        return await prisma.brand.findMany({
            include: { models: true },
            orderBy: { name: 'asc' }
        });
    }

    // Get single brand by ID
    async getBrandById(id: number) {
        return await prisma.brand.findUnique({
            where: { id },
            include: {
                models: {
                    include: { variants: true }
                }
            }
        });
    }

    // Create new brand
    async createBrand(name: string, slug: string) {
        return await prisma.brand.create({
            data: { name, slug }
        });
    }

    // Update brand
    async updateBrand(id: number, name: string, slug: string) {
        return await prisma.brand.update({
            where: { id },
            data: { name, slug }
        });
    }

    // Delete brand (will cascade delete models and variants)
    async deleteBrand(id: number) {
        return await prisma.brand.delete({
            where: { id }
        });
    }

    // ========== MODEL MANAGEMENT ==========

    // Get all models
    async getModelList() {
        return await prisma.model.findMany({
            include: {
                brand: { select: { name: true } },
                variants: true
            },
            orderBy: { name: 'asc' }
        });
    }

    // Get single model by ID
    async getModelById(id: number) {
        return await prisma.model.findUnique({
            where: { id },
            include: {
                brand: true,
                variants: true
            }
        });
    }

    // Create new model
    async createModel(name: string, slug: string, type: string, brandId: number) {
        const brandExists = await prisma.brand.findUnique({ where: { id: brandId } });
        if (!brandExists) throw new NotFoundException(`Brand ID ${brandId} not found`);

        return await prisma.model.create({
            data: { name, slug, type, brandId }
        });
    }

    // Update model
    async updateModel(id: number, name: string, slug: string, type: string) {
        return await prisma.model.update({
            where: { id },
            data: { name, slug, type }
        });
    }

    // Delete model (will cascade delete variants)
    async deleteModel(id: number) {
        return await prisma.model.delete({
            where: { id }
        });
    }

    // ========== VARIANT MANAGEMENT ==========

    // Create a new Variant
    async createVariant(data: CreateVariantDto) {
        const modelExists = await prisma.model.findUnique({ where: { id: data.modelId } });
        if (!modelExists) throw new NotFoundException(`Model ID ${data.modelId} not found`);

        return await prisma.variant.create({
            data: {
                name: data.name,
                priceExShowroom: data.priceExShowroom,
                fuelType: data.fuelType,
                transmission: data.transmission,
                specs: data.specs || {},
                colors: data.colors || [],
                modelId: data.modelId,
            },
        });
    }

    // Update variant price
    async updatePrice(variantId: number, newPrice: number) {
        return await prisma.variant.update({
            where: { id: variantId },
            data: { priceExShowroom: newPrice },
        });
    }

    // Update complete variant
    async updateVariant(variantId: number, data: Partial<CreateVariantDto>) {
        return await prisma.variant.update({
            where: { id: variantId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.priceExShowroom && { priceExShowroom: data.priceExShowroom }),
                ...(data.fuelType && { fuelType: data.fuelType }),
                ...(data.transmission && { transmission: data.transmission }),
                ...(data.specs && { specs: data.specs }),
                ...(data.colors && { colors: data.colors }),
            }
        });
    }

    // Delete a variant
    async deleteVariant(variantId: number) {
        return await prisma.variant.delete({
            where: { id: variantId },
        });
    }

    // Get all variants
    async getAllVariants() {
        return await prisma.variant.findMany({
            orderBy: { id: 'desc' },
            include: {
                model: {
                    include: { brand: true }
                }
            }
        });
    }

    // Get single variant by ID
    async getVariantById(id: number) {
        return await prisma.variant.findUnique({
            where: { id },
            include: {
                model: {
                    include: { brand: true }
                }
            }
        });
    }
}