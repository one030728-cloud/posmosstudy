-- DropForeignKey
ALTER TABLE "BillingKey" DROP CONSTRAINT "BillingKey_studentId_fkey";

-- DropForeignKey
ALTER TABLE "BillingSchedule" DROP CONSTRAINT "BillingSchedule_studentId_fkey";

-- AlterTable
ALTER TABLE "PaymentHistory" DROP COLUMN "type";

-- DropTable
DROP TABLE "BillingKey";

-- DropTable
DROP TABLE "BillingSchedule";

-- DropEnum
DROP TYPE "BillingKeyStatus";

-- DropEnum
DROP TYPE "PaymentType";

