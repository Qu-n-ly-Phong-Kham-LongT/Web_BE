-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "diagnoses" JSONB,
ADD COLUMN     "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPatientRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiveResultAtClinic" BOOLEAN NOT NULL DEFAULT false;
