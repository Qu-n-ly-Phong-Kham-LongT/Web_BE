-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "followUpDate" TIMESTAMPTZ,
ADD COLUMN     "followUpSession" "Session",
ADD COLUMN     "isFollowUpTransferred" BOOLEAN NOT NULL DEFAULT false;
