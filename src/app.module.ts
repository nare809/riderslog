import { Module } from '@nestjs/common';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AdminModule } from './admin/admin.module';

@Module({
    imports: [VehiclesModule, AdminModule], // Connects your Vehicles feature
    controllers: [],
    providers: [],
})
export class AppModule { }