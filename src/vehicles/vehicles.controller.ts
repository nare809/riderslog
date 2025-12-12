import { Controller, Get, Param, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

@Controller()
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    // 0. Get Brands
    @Get('brands')
    getBrands() {
        return this.vehiclesService.getBrands();
    }

    @Get('brands/:slug')
    getBrand(@Param('slug') slug: string) {
        return this.vehiclesService.getBrandBySlug(slug);
    }


    // 1. Recommendation Endpoint (Must come BEFORE :slug)
    // Usage: /vehicles/recommend?min=500000&max=1500000&fuel=Diesel
    @Get('cars/recommend')
    recommend(
        @Query('min') min?: string,
        @Query('max') max?: string,
        @Query('fuel') fuel?: string,
        @Query('trans') trans?: string,
        @Query('type') type?: string,
    ) {
        return this.vehiclesService.findPerfectCar(
            Number(min),
            Number(max),
            fuel,
            trans,
            type
        );
    }

    // 2. Get All
    @Get('cars')
    getAll() {
        return this.vehiclesService.getAllModels();
    }

    // 3. Get One (Specific Slug)
    @Get('cars/:slug')
    getOne(@Param('slug') slug: string) {
        return this.vehiclesService.getModelBySlug(slug);
    }
}