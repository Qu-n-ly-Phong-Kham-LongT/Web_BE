-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "PatientCategory" AS ENUM ('BHYT', 'DichVu', 'UuTien');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('None', 'Yes', 'Unknown', 'Breastfeeding');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Unpaid', 'Paid');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('CATEGORY', 'TYPE');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('Boolean', 'Text', 'Select');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('Morning', 'Afternoon', 'Evening');

-- CreateEnum
CREATE TYPE "InventoryLogType" AS ENUM ('Import', 'Export', 'Adjustment', 'Return');

-- AlterEnum
ALTER TYPE "UserRoleEnum" ADD VALUE 'Staff';

-- AlterTable
ALTER TABLE "Roles" ALTER COLUMN "RoleName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "Username" DROP NOT NULL,
ALTER COLUMN "Password" DROP NOT NULL,
ALTER COLUMN "FullName" DROP NOT NULL,
ALTER COLUMN "Status" DROP NOT NULL,
ALTER COLUMN "Created_At" DROP NOT NULL,
ALTER COLUMN "Updated_At" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Patients" (
    "PatientID" UUID NOT NULL,
    "PatientCode" TEXT,
    "FullName" TEXT,
    "Gender" "Gender",
    "DOB" TIMESTAMP(3),
    "PatientCategory" "PatientCategory" DEFAULT 'DichVu',
    "Phone" TEXT,
    "Email" TEXT,
    "IdentityCard" TEXT,
    "InsuranceNumber" TEXT,
    "Occupation" TEXT,
    "Address" TEXT,
    "Created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3),

    CONSTRAINT "Patients_pkey" PRIMARY KEY ("PatientID")
);

-- CreateTable
CREATE TABLE "PatientRelatives" (
    "RelativeID" UUID NOT NULL,
    "PatientID" UUID,
    "FullName" TEXT,
    "Phone" TEXT,
    "Relationship" TEXT,
    "IdentityCard" TEXT,
    "Address" TEXT,

    CONSTRAINT "PatientRelatives_pkey" PRIMARY KEY ("RelativeID")
);

-- CreateTable
CREATE TABLE "MedicalRecords" (
    "RecordID" UUID NOT NULL,
    "RecordCode" TEXT,
    "PatientID" UUID,
    "DoctorID" UUID,
    "Diagnoses" JSONB,
    "EvidenceBasedDiagnosis" BOOLEAN DEFAULT false,
    "DoctorAdvice" TEXT,
    "TreatmentNote" TEXT,
    "ConsultationFee" DECIMAL(65,30) DEFAULT 0,
    "Created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3),

    CONSTRAINT "MedicalRecords_pkey" PRIMARY KEY ("RecordID")
);

-- CreateTable
CREATE TABLE "ClinicalExaminations" (
    "ExamID" UUID NOT NULL,
    "RecordID" UUID,
    "ReasonForVisit" TEXT,
    "MedicalHistory" TEXT,
    "PastMedicalHistory" TEXT,
    "HeartRate" INTEGER,
    "BloodPressure" TEXT,
    "Temperature" DOUBLE PRECISION,
    "Height" DOUBLE PRECISION,
    "Weight" DOUBLE PRECISION,
    "ClinicalExamination" TEXT,
    "PregnancyStatus" "PregnancyStatus" DEFAULT 'None',
    "PregnancyWeeks" INTEGER,
    "DrugAllergies" TEXT,
    "ClinicalNotes" TEXT,
    "ExaminedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ExaminedBy" UUID,

    CONSTRAINT "ClinicalExaminations_pkey" PRIMARY KEY ("ExamID")
);

-- CreateTable
CREATE TABLE "ICD10_Dictionary" (
    "Code" TEXT NOT NULL,
    "Description" TEXT,

    CONSTRAINT "ICD10_Dictionary_pkey" PRIMARY KEY ("Code")
);

-- CreateTable
CREATE TABLE "Prescriptions" (
    "PrescriptionID" UUID NOT NULL,
    "RecordID" UUID,
    "PdfPath" TEXT,
    "FileName" TEXT,
    "Note" TEXT,
    "TotalPrice" DECIMAL(65,30),
    "PaymentStatus" "PaymentStatus" DEFAULT 'Unpaid',
    "Created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescriptions_pkey" PRIMARY KEY ("PrescriptionID")
);

-- CreateTable
CREATE TABLE "PrescriptionDetails" (
    "DetailID" UUID NOT NULL,
    "PrescriptionID" UUID,
    "MedicineID" UUID,
    "Unit" TEXT,
    "FrequencyPerDay" INTEGER,
    "QuantityPerTime" DOUBLE PRECISION,
    "AdministrationRoute" TEXT,
    "Timing" TEXT,
    "Quantity" INTEGER,
    "DaysToTake" INTEGER,
    "Price" DOUBLE PRECISION,
    "IsInsuranceCovered" BOOLEAN DEFAULT false,
    "AppliedExportPrice" DECIMAL(65,30),
    "Note" TEXT,

    CONSTRAINT "PrescriptionDetails_pkey" PRIMARY KEY ("DetailID")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplates" (
    "TemplateID" UUID NOT NULL,
    "TemplateName" TEXT,
    "Description" TEXT,
    "CreatedBy" UUID,

    CONSTRAINT "PrescriptionTemplates_pkey" PRIMARY KEY ("TemplateID")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplateDetails" (
    "TemplateDetailID" UUID NOT NULL,
    "TemplateID" UUID,
    "MedicineID" UUID,
    "DefaultFrequency" INTEGER,
    "DefaultQuantityPerTime" DOUBLE PRECISION,
    "DefaultRoute" TEXT,
    "DefaultTiming" TEXT,

    CONSTRAINT "PrescriptionTemplateDetails_pkey" PRIMARY KEY ("TemplateDetailID")
);

-- CreateTable
CREATE TABLE "FollowUps" (
    "FollowUpID" UUID NOT NULL,
    "RecordID" UUID,
    "AppointmentDate" DATE,
    "Session" "Session",
    "Reason" TEXT,

    CONSTRAINT "FollowUps_pkey" PRIMARY KEY ("FollowUpID")
);

-- CreateTable
CREATE TABLE "ServiceNodes" (
    "NodeID" UUID NOT NULL,
    "NodeType" "NodeType",
    "ParentID" UUID,
    "Code" TEXT,
    "Name" TEXT,
    "Note" TEXT,
    "IsActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ServiceNodes_pkey" PRIMARY KEY ("NodeID")
);

-- CreateTable
CREATE TABLE "ServiceItems" (
    "ItemID" UUID NOT NULL,
    "ItemCode" TEXT,
    "Name" TEXT,
    "CategoryID" UUID,
    "TypeID" UUID,
    "Unit" TEXT,
    "Specimen" TEXT,
    "PrepNote" TEXT,
    "IsActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ServiceItems_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "ServiceItemConfigs" (
    "ConfigID" UUID NOT NULL,
    "ItemID" UUID,
    "ConfigCode" TEXT,
    "DisplayName" TEXT,
    "InputType" "InputType" DEFAULT 'Boolean',
    "GroupName" TEXT,
    "MetaData" JSONB,

    CONSTRAINT "ServiceItemConfigs_pkey" PRIMARY KEY ("ConfigID")
);

-- CreateTable
CREATE TABLE "ServiceRequests" (
    "RequestID" UUID NOT NULL,
    "RequestCode" TEXT,
    "RecordID" UUID,
    "OrderingDoctorID" UUID,
    "Note" TEXT,
    "CreatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequests_pkey" PRIMARY KEY ("RequestID")
);

-- CreateTable
CREATE TABLE "ServiceRequestDetails" (
    "RequestDetailID" UUID NOT NULL,
    "RequestID" UUID,
    "ItemID" UUID,
    "SelectedOptions" JSONB,

    CONSTRAINT "ServiceRequestDetails_pkey" PRIMARY KEY ("RequestDetailID")
);

-- CreateTable
CREATE TABLE "ServiceResults" (
    "ResultID" UUID NOT NULL,
    "DetailID" UUID,
    "ResultCode" TEXT,
    "Description" TEXT,
    "Conclusion" TEXT,
    "Note" TEXT,
    "IsPDF" BOOLEAN DEFAULT false,
    "PdfUrl" TEXT,
    "PerformingDoctorID" UUID,
    "ExecutedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceResults_pkey" PRIMARY KEY ("ResultID")
);

-- CreateTable
CREATE TABLE "ServiceTemplates" (
    "TemplateID" UUID NOT NULL,
    "TemplateName" TEXT,
    "Description" TEXT,
    "CreatedBy" UUID,
    "IsActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ServiceTemplates_pkey" PRIMARY KEY ("TemplateID")
);

-- CreateTable
CREATE TABLE "ServiceTemplateDetails" (
    "TemplateDetailID" UUID NOT NULL,
    "TemplateID" UUID,
    "ItemID" UUID,
    "Note" TEXT,

    CONSTRAINT "ServiceTemplateDetails_pkey" PRIMARY KEY ("TemplateDetailID")
);

-- CreateTable
CREATE TABLE "Medicines" (
    "MedicineID" UUID NOT NULL,
    "MedicineCode" TEXT,
    "MedicineName" TEXT,
    "ActiveIngredient" TEXT,
    "IsInsuranceCovered" BOOLEAN DEFAULT false,
    "MedicineCodeBHYT" TEXT,
    "InsurancePrice" DECIMAL(65,30),
    "BaseUnit" TEXT,
    "TotalQuantity" INTEGER DEFAULT 0,
    "SellPrice" DECIMAL(65,30),
    "Note" TEXT,
    "Supplier" TEXT,
    "SideEffects" TEXT,
    "IsActive" BOOLEAN DEFAULT true,
    "CreatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicines_pkey" PRIMARY KEY ("MedicineID")
);

-- CreateTable
CREATE TABLE "InventoryLogs" (
    "LogID" UUID NOT NULL,
    "MedicineID" UUID,
    "Type" "InventoryLogType",
    "Quantity" INTEGER,
    "QuantityBase" INTEGER,
    "UnitPrice" DECIMAL(65,30),
    "TotalPrice" DECIMAL(65,30),
    "PerformedBy" UUID,
    "Note" TEXT,
    "CreatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLogs_pkey" PRIMARY KEY ("LogID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patients_PatientCode_key" ON "Patients"("PatientCode");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_Phone_key" ON "Patients"("Phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_IdentityCard_key" ON "Patients"("IdentityCard");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_InsuranceNumber_key" ON "Patients"("InsuranceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRelatives_IdentityCard_key" ON "PatientRelatives"("IdentityCard");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecords_RecordCode_key" ON "MedicalRecords"("RecordCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalExaminations_RecordID_key" ON "ClinicalExaminations"("RecordID");

-- CreateIndex
CREATE UNIQUE INDEX "Prescriptions_RecordID_key" ON "Prescriptions"("RecordID");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUps_RecordID_key" ON "FollowUps"("RecordID");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceNodes_Code_key" ON "ServiceNodes"("Code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItems_ItemCode_key" ON "ServiceItems"("ItemCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequests_RequestCode_key" ON "ServiceRequests"("RequestCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceResults_DetailID_key" ON "ServiceResults"("DetailID");

-- CreateIndex
CREATE UNIQUE INDEX "Medicines_MedicineCode_key" ON "Medicines"("MedicineCode");

-- AddForeignKey
ALTER TABLE "PatientRelatives" ADD CONSTRAINT "PatientRelatives_PatientID_fkey" FOREIGN KEY ("PatientID") REFERENCES "Patients"("PatientID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_PatientID_fkey" FOREIGN KEY ("PatientID") REFERENCES "Patients"("PatientID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecords" ADD CONSTRAINT "MedicalRecords_DoctorID_fkey" FOREIGN KEY ("DoctorID") REFERENCES "Users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExaminations" ADD CONSTRAINT "ClinicalExaminations_RecordID_fkey" FOREIGN KEY ("RecordID") REFERENCES "MedicalRecords"("RecordID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriptions" ADD CONSTRAINT "Prescriptions_RecordID_fkey" FOREIGN KEY ("RecordID") REFERENCES "MedicalRecords"("RecordID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetails" ADD CONSTRAINT "PrescriptionDetails_PrescriptionID_fkey" FOREIGN KEY ("PrescriptionID") REFERENCES "Prescriptions"("PrescriptionID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetails" ADD CONSTRAINT "PrescriptionDetails_MedicineID_fkey" FOREIGN KEY ("MedicineID") REFERENCES "Medicines"("MedicineID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplates" ADD CONSTRAINT "PrescriptionTemplates_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetails" ADD CONSTRAINT "PrescriptionTemplateDetails_TemplateID_fkey" FOREIGN KEY ("TemplateID") REFERENCES "PrescriptionTemplates"("TemplateID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetails" ADD CONSTRAINT "PrescriptionTemplateDetails_MedicineID_fkey" FOREIGN KEY ("MedicineID") REFERENCES "Medicines"("MedicineID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUps" ADD CONSTRAINT "FollowUps_RecordID_fkey" FOREIGN KEY ("RecordID") REFERENCES "MedicalRecords"("RecordID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceNodes" ADD CONSTRAINT "ServiceNodes_ParentID_fkey" FOREIGN KEY ("ParentID") REFERENCES "ServiceNodes"("NodeID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItems" ADD CONSTRAINT "ServiceItems_CategoryID_fkey" FOREIGN KEY ("CategoryID") REFERENCES "ServiceNodes"("NodeID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItems" ADD CONSTRAINT "ServiceItems_TypeID_fkey" FOREIGN KEY ("TypeID") REFERENCES "ServiceNodes"("NodeID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItemConfigs" ADD CONSTRAINT "ServiceItemConfigs_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "ServiceItems"("ItemID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequests" ADD CONSTRAINT "ServiceRequests_RecordID_fkey" FOREIGN KEY ("RecordID") REFERENCES "MedicalRecords"("RecordID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequests" ADD CONSTRAINT "ServiceRequests_OrderingDoctorID_fkey" FOREIGN KEY ("OrderingDoctorID") REFERENCES "Users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestDetails" ADD CONSTRAINT "ServiceRequestDetails_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "ServiceRequests"("RequestID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestDetails" ADD CONSTRAINT "ServiceRequestDetails_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "ServiceItems"("ItemID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResults" ADD CONSTRAINT "ServiceResults_DetailID_fkey" FOREIGN KEY ("DetailID") REFERENCES "ServiceRequestDetails"("RequestDetailID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResults" ADD CONSTRAINT "ServiceResults_PerformingDoctorID_fkey" FOREIGN KEY ("PerformingDoctorID") REFERENCES "Users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetails" ADD CONSTRAINT "ServiceTemplateDetails_TemplateID_fkey" FOREIGN KEY ("TemplateID") REFERENCES "ServiceTemplates"("TemplateID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetails" ADD CONSTRAINT "ServiceTemplateDetails_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "ServiceItems"("ItemID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLogs" ADD CONSTRAINT "InventoryLogs_MedicineID_fkey" FOREIGN KEY ("MedicineID") REFERENCES "Medicines"("MedicineID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLogs" ADD CONSTRAINT "InventoryLogs_PerformedBy_fkey" FOREIGN KEY ("PerformedBy") REFERENCES "Users"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
