-- AlterTable
ALTER TABLE "ClinicalExamination" ADD COLUMN     "hasPoorAppetite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasWeightLoss" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ClinicWorkingSession" (
    "workingSessionId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clinicId" UUID NOT NULL,
    "sessionType" "Session" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ClinicWorkingSession_pkey" PRIMARY KEY ("workingSessionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicWorkingSession_clinicId_sessionType_key" ON "ClinicWorkingSession"("clinicId", "sessionType");

-- AddForeignKey
ALTER TABLE "ClinicWorkingSession" ADD CONSTRAINT "ClinicWorkingSession_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE CASCADE ON UPDATE CASCADE;
