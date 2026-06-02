-- Add SUPERVISOR to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERVISOR';

-- Create supervisors table
CREATE TABLE IF NOT EXISTS "supervisors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "supervisors_userId_key" ON "supervisors"("userId");

-- Add foreign key
ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
