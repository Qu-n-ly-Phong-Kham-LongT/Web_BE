-- DropIndex
DROP INDEX "Medicine_medicineCode_key";

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX "Medicine_medicineCode_active_unique"
ON "Medicine" ("medicineCode")
WHERE "deletedAt" IS NULL;