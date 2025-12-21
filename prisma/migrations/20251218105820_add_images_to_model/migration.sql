-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "images" JSONB,
ADD COLUMN     "mainImageUrl" TEXT;
