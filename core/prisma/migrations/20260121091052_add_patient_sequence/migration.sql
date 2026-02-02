-- CreateTable
CREATE TABLE "PatientSequence" (
    "clinicId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PatientSequence_pkey" PRIMARY KEY ("clinicId","monthKey")
);

-- AddForeignKey
ALTER TABLE "PatientSequence" ADD CONSTRAINT "PatientSequence_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE CASCADE ON UPDATE CASCADE;
