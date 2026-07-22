-- CreateEnum
CREATE TYPE "BulkLinkStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "ScheduledBulkLink" (
    "id" TEXT NOT NULL,
    "studentIds" TEXT[],
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "BulkLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledBulkLink_pkey" PRIMARY KEY ("id")
);

