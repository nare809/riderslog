export class CreateVariantDto {
    name: string;
    priceExShowroom: number;
    fuelType: string;
    transmission: string;
    modelId: number; // We need to know which Model this belongs to
    specs?: any;     // Optional JSON specs
    colors?: any;    // Optional JSON colors
}