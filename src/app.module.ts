import { Module } from '@nestjs/common';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AdminModule } from './admin/admin.module';
import { ImagesModule } from './images/images.module';

@Module({
    imports: [VehiclesModule, AdminModule, ImagesModule],
    controllers: [],
    providers: [],
})
export class AppModule { }