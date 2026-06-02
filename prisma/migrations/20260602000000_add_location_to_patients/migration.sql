-- Add live location tracking columns to patients table
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMP(3);
