import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ========== BRAND ENDPOINTS ==========

    @Get('brands')
    getAllBrands() {
        return this.adminService.getAllBrands();
    }

    @Get('brands/:id')
    getBrand(@Param('id') id: string) {
        return this.adminService.getBrandById(Number(id));
    }

    @Post('brands')
    createBrand(@Body() body: { name: string; slug: string }) {
        return this.adminService.createBrand(body.name, body.slug);
    }

    @Put('brands/:id')
    updateBrand(@Param('id') id: string, @Body() body: { name: string; slug: string }) {
        return this.adminService.updateBrand(Number(id), body.name, body.slug);
    }

    @Delete('brands/:id')
    deleteBrand(@Param('id') id: string) {
        return this.adminService.deleteBrand(Number(id));
    }

    // ========== MODEL ENDPOINTS ==========

    @Get('cars')
    getModels() {
        return this.adminService.getModelList();
    }

    @Get('cars/:id')
    getModel(@Param('id') id: string) {
        return this.adminService.getModelById(Number(id));
    }

    @Post('cars')
    createModel(@Body() body: { name: string; slug: string; type: string; brandId: number }) {
        return this.adminService.createModel(body.name, body.slug, body.type, body.brandId);
    }

    @Put('cars/:id')
    updateModel(@Param('id') id: string, @Body() body: { name: string; slug: string; type: string }) {
        return this.adminService.updateModel(Number(id), body.name, body.slug, body.type);
    }

    @Delete('cars/:id')
    deleteModel(@Param('id') id: string) {
        return this.adminService.deleteModel(Number(id));
    }

    // ========== VARIANT ENDPOINTS ==========

    @Get('variants')
    getVariants() {
        return this.adminService.getAllVariants();
    }

    @Get('variants/:id')
    getVariant(@Param('id') id: string) {
        return this.adminService.getVariantById(Number(id));
    }

    @Post('variants')
    createVariant(@Body() createVariantDto: CreateVariantDto) {
        return this.adminService.createVariant(createVariantDto);
    }

    @Patch('variants/:id/price')
    updatePrice(@Param('id') id: string, @Body() body: UpdatePriceDto) {
        return this.adminService.updatePrice(Number(id), body.price);
    }

    @Put('variants/:id')
    updateVariant(@Param('id') id: string, @Body() body: Partial<CreateVariantDto>) {
        return this.adminService.updateVariant(Number(id), body);
    }

    @Delete('variants/:id')
    deleteVariant(@Param('id') id: string) {
        return this.adminService.deleteVariant(Number(id));
    }
}