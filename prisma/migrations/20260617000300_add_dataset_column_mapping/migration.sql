-- AlterTable
ALTER TABLE "UploadedData" ADD COLUMN "columnMapping" JSONB;
ALTER TABLE "UploadedData" ADD COLUMN "compatibilityScore" INTEGER;
ALTER TABLE "UploadedData" ADD COLUMN "compatibilityDetails" JSONB;
