-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('INTERNAL', 'EXTERNAL', 'OTHER');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "type" "PersonType" NOT NULL DEFAULT 'OTHER';
