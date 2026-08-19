-- =====================================================================
-- Baseline: dung toan bo schema tu dau.
--   1. Extension
--   2. Sequence + function duoc dung lam DEFAULT cot
--   3. Bang / enum / khoa ngoai (Prisma sinh tu schema.prisma)
--   4. Function sinh ma nghiep vu + trigger (Prisma khong quan ly)
-- =====================================================================

-- ---------- 1. Extension ----------
-- schema dung uuid_generate_v4() lam default cho hau het khoa chinh
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- 2. Sequence + function cho DEFAULT ----------
CREATE SEQUENCE IF NOT EXISTS clinic_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_clinic_code() 
RETURNS TEXT AS $$
DECLARE
    seq_val INT;
    letters TEXT := '';
    numbers TEXT;
    temp_val INT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
BEGIN
    -- Lấy giá trị từ sequence
    seq_val := nextval('clinic_code_seq');
    
    -- Xử lý phần số (3 số cuối: ví dụ 001, 002...)
    numbers := LPAD(((seq_val - 1) % 1000 + 1)::TEXT, 3, '0');
    
    -- Xử lý phần chữ (3 chữ cái đầu: AAA, AAB...)
    temp_val := (seq_val - 1) / 1000;
    letters := substr(chars, ((temp_val / (26 * 26)) % 26) + 1, 1) ||
               substr(chars, ((temp_val / 26) % 26) + 1, 1) ||
               substr(chars, (temp_val % 26) + 1, 1);
               
    RETURN letters || numbers;
END;
$$ LANGUAGE plpgsql;

-- ---------- 3. Bang / enum / khoa ngoai ----------
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "UserRoleEnum" AS ENUM ('Manager', 'Doctor', 'Admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "PatientCategory" AS ENUM ('BHYT', 'DichVu', 'UuTien');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('None', 'Yes', 'Unknown', 'Breastfeeding');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('Draft', 'Issued', 'Cancelled');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('CATEGORY', 'TYPE');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('Text', 'Number', 'Select', 'Boolean', 'LongText', 'Checkbox');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('Morning', 'Noon', 'Afternoon', 'Evening');

-- CreateEnum
CREATE TYPE "InventoryLogType" AS ENUM ('Import', 'Export', 'Adjustment');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('MEDICAL_RECORD', 'PRESCRIPTION', 'SERVICE_REQUEST', 'SERVICE_RESULT', 'OTHER');

-- CreateEnum
CREATE TYPE "PrintJobType" AS ENUM ('MEDICAL_RECORD', 'PRESCRIPTION', 'SERVICE_REQUEST');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Role" (
    "roleId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "roleName" "UserRoleEnum" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "logId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clinicId" UUID,
    "username" VARCHAR(100),
    "role" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entityName" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100),
    "requestMethod" VARCHAR(10) NOT NULL,
    "requestUrl" TEXT NOT NULL,
    "remoteAddress" VARCHAR(50),
    "requestBody" JSONB DEFAULT '{}',
    "responseBody" JSONB DEFAULT '{}',
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("logId")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "clinicId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clinicName" VARCHAR(255),
    "address" VARCHAR(255),
    "phones" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
    "email" VARCHAR(150),
    "consultationFee" DECIMAL(10,0),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "clinicCode" VARCHAR(100) DEFAULT generate_clinic_code(),

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("clinicId")
);

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

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "token" VARCHAR(500) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Patient" (
    "patientId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patientCode" TEXT,
    "fullName" TEXT,
    "gender" "Gender",
    "dob" TIMESTAMPTZ,
    "patientCategory" "PatientCategory" DEFAULT 'DichVu',
    "phone" TEXT,
    "email" TEXT,
    "identityCard" TEXT,
    "insuranceNumber" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "clinicId" UUID,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patientId")
);

-- CreateTable
CREATE TABLE "PatientSequence" (
    "clinicId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PatientSequence_pkey" PRIMARY KEY ("clinicId","monthKey")
);

-- CreateTable
CREATE TABLE "PatientRelative" (
    "relativeId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patientId" UUID,
    "fullName" TEXT,
    "phone" TEXT,
    "relationship" TEXT,
    "identityCard" TEXT,
    "address" TEXT,

    CONSTRAINT "PatientRelative_pkey" PRIMARY KEY ("relativeId")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "allergyId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patientId" UUID NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("allergyId")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "recordId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordCode" TEXT,
    "patientId" UUID,
    "doctorId" UUID,
    "diagnoses" JSONB,
    "diagnosisNote" TEXT,
    "evidenceBasedDiagnosis" BOOLEAN DEFAULT false,
    "doctorAdvice" TEXT,
    "treatmentNote" TEXT,
    "consultationFee" DECIMAL(18,0) DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "isDeleted" BOOLEAN DEFAULT false,
    "clinicId" UUID,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("recordId")
);

-- CreateTable
CREATE TABLE "MedicalRecordSequence" (
    "patientId" UUID NOT NULL,
    "monthKey" VARCHAR(4) NOT NULL,
    "currentVal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("patientId","monthKey")
);

-- CreateTable
CREATE TABLE "ClinicalExamination" (
    "examId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordId" UUID,
    "reasonForVisit" TEXT,
    "medicalHistory" TEXT,
    "pastMedicalHistory" TEXT,
    "heartRate" INTEGER,
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "clinicalExamination" TEXT,
    "pregnancyStatus" "PregnancyStatus" DEFAULT 'None',
    "pregnancyWeeks" INTEGER,
    "isBreastfeeding" BOOLEAN NOT NULL DEFAULT false,
    "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
    "hasPoorAppetite" BOOLEAN NOT NULL DEFAULT false,
    "hasWeightLoss" BOOLEAN NOT NULL DEFAULT false,
    "clinicalNotes" TEXT,
    "examinedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "examinedBy" UUID,
    "userId" UUID,

    CONSTRAINT "ClinicalExamination_pkey" PRIMARY KEY ("examId")
);

-- CreateTable
CREATE TABLE "Icd10Dictionary" (
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Icd10Dictionary_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Dictionary" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "prescriptionId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prescriptionCode" TEXT,
    "recordId" UUID,
    "note" TEXT,
    "totalPrice" DECIMAL(18,0),
    "status" "PrescriptionStatus" DEFAULT 'Draft',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "printedAt" TIMESTAMPTZ,
    "printCount" INTEGER DEFAULT 1,
    "isDispensed" BOOLEAN DEFAULT false,
    "dispensedAt" TIMESTAMPTZ,
    "dispensedBy" UUID,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("prescriptionId")
);

-- CreateTable
CREATE TABLE "PrescriptionDetail" (
    "detailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prescriptionId" UUID,
    "medicineId" UUID,
    "unit" TEXT,
    "frequencyPerDay" INTEGER,
    "quantityPerTime" DECIMAL(10,2),
    "administrationRoute" TEXT,
    "timing" TEXT,
    "quantity" DECIMAL(10,2),
    "daysToTake" INTEGER,
    "isInsuranceCovered" BOOLEAN DEFAULT false,
    "appliedExportPrice" DECIMAL(18,0),
    "appliedImportPrice" DECIMAL(18,0),
    "totalPrice" DECIMAL(18,0),
    "note" TEXT,

    CONSTRAINT "PrescriptionDetail_pkey" PRIMARY KEY ("detailId")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "followUpId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordId" UUID,
    "appointmentDate" DATE,
    "session" "Session",
    "reason" TEXT,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("followUpId")
);

-- CreateTable
CREATE TABLE "ServiceNode" (
    "nodeId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nodeType" "NodeType",
    "parentId" UUID,
    "code" TEXT,
    "name" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "ServiceNode_pkey" PRIMARY KEY ("nodeId")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "itemId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "itemCode" TEXT,
    "name" TEXT,
    "categoryId" UUID,
    "typeId" UUID,
    "basePrice" DECIMAL(18,0),
    "unit" TEXT,
    "specimen" TEXT,
    "prepNote" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "ServiceItemConfig" (
    "configId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "itemId" UUID,
    "configCode" TEXT,
    "displayName" TEXT,
    "inputType" "InputType" DEFAULT 'Text',
    "unit" TEXT,
    "metaData" JSONB,
    "refRange" TEXT,

    CONSTRAINT "ServiceItemConfig_pkey" PRIMARY KEY ("configId")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "requestId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestCode" TEXT,
    "recordId" UUID,
    "orderingDoctorId" UUID,
    "diagnoses" JSONB,
    "diagnosisNote" TEXT,
    "isPatientRequested" BOOLEAN NOT NULL DEFAULT false,
    "receiveResultAtClinic" BOOLEAN NOT NULL DEFAULT false,
    "isForFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "isFollowUpTransferred" BOOLEAN NOT NULL DEFAULT false,
    "isPrinted" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "followUpDate" TIMESTAMPTZ,
    "followUpSession" "Session",
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "ServiceRequestDetail" (
    "requestDetailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestId" UUID,
    "itemId" UUID,
    "selectedOptions" JSONB,

    CONSTRAINT "ServiceRequestDetail_pkey" PRIMARY KEY ("requestDetailId")
);

-- CreateTable
CREATE TABLE "ServiceResult" (
    "resultId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "detailId" UUID,
    "requestId" UUID,
    "itemId" UUID,
    "configId" UUID,
    "parentId" UUID,
    "indicatorName" TEXT,
    "valueString" TEXT,
    "valueNumber" DECIMAL(10,2),
    "unit" TEXT,
    "executedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "ServiceResult_pkey" PRIMARY KEY ("resultId")
);

-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "templateId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateTable
CREATE TABLE "ServiceTemplateDetail" (
    "templateDetailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateId" UUID,
    "itemId" UUID,
    "configSelections" JSONB,
    "note" TEXT,

    CONSTRAINT "ServiceTemplateDetail_pkey" PRIMARY KEY ("templateDetailId")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "medicineId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "medicineCode" TEXT,
    "medicineName" TEXT,
    "activeIngredient" TEXT,
    "registrationNo" TEXT,
    "isInsuranceCovered" BOOLEAN DEFAULT false,
    "medicineCodeBhyt" TEXT,
    "insurancePrice" DECIMAL(18,0),
    "baseUnit" TEXT,
    "totalQuantity" INTEGER DEFAULT 0,
    "sellPrice" DECIMAL(18,0),
    "importPrice" DECIMAL(18,0),
    "note" TEXT,
    "supplier" TEXT,
    "sideEffects" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "clinicId" UUID,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("medicineId")
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "logId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "medicineId" UUID,
    "type" "InventoryLogType",
    "quantity" INTEGER,
    "shortage" INTEGER,
    "quantityBase" INTEGER,
    "unitPrice" DECIMAL(18,0),
    "totalPrice" DECIMAL(18,0),
    "performedBy" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "prescriptionId" UUID,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("logId")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplate" (
    "templateId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateName" TEXT NOT NULL,
    "description" TEXT,
    "daysToTake" INTEGER,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplateDetail" (
    "templateDetailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateId" UUID NOT NULL,
    "medicineId" UUID NOT NULL,
    "defaultFrequency" INTEGER,
    "defaultQuantityPerTime" DOUBLE PRECISION,
    "defaultRoute" TEXT,
    "defaultTiming" TEXT,

    CONSTRAINT "PrescriptionTemplateDetail_pkey" PRIMARY KEY ("templateDetailId")
);

-- CreateTable
CREATE TABLE "File" (
    "fileID" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "relativePath" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicalRecordId" UUID,
    "prescriptionId" UUID,
    "serviceRequestId" UUID,
    "serviceResultId" UUID,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fileID")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "jobId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "PrintJobType" NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "entityId" UUID,
    "clinicId" UUID,
    "userId" UUID,
    "payload" JSONB DEFAULT '{}',
    "errorMsg" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "startedAt" TIMESTAMPTZ,
    "finishedAt" TIMESTAMPTZ,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("jobId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE INDEX "AuditLog_username_idx" ON "AuditLog"("username");

-- CreateIndex
CREATE INDEX "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_clinicCode_key" ON "Clinic"("clinicCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicWorkingSession_clinicId_sessionType_key" ON "ClinicWorkingSession"("clinicId", "sessionType");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_patientId_key" ON "PatientAllergy"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_recordCode_key" ON "MedicalRecord"("recordCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalExamination_recordId_key" ON "ClinicalExamination"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionCode_key" ON "Prescription"("prescriptionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_recordId_key" ON "Prescription"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_recordId_key" ON "FollowUp"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestCode_key" ON "ServiceRequest"("requestCode");

-- CreateIndex
CREATE UNIQUE INDEX "File_prescriptionId_key" ON "File"("prescriptionId");

-- CreateIndex
CREATE INDEX "PrintJob_status_idx" ON "PrintJob"("status");

-- CreateIndex
CREATE INDEX "PrintJob_type_idx" ON "PrintJob"("type");

-- CreateIndex
CREATE INDEX "PrintJob_entityId_idx" ON "PrintJob"("entityId");

-- CreateIndex
CREATE INDEX "PrintJob_clinicId_idx" ON "PrintJob"("clinicId");

-- CreateIndex
CREATE INDEX "PrintJob_userId_idx" ON "PrintJob"("userId");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "PrintJob"("createdAt");

-- AddForeignKey
ALTER TABLE "ClinicWorkingSession" ADD CONSTRAINT "ClinicWorkingSession_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSequence" ADD CONSTRAINT "PatientSequence_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRelative" ADD CONSTRAINT "PatientRelative_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecordSequence" ADD CONSTRAINT "MedicalRecordSequence_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_examinedBy_fkey" FOREIGN KEY ("examinedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetail" ADD CONSTRAINT "PrescriptionDetail_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("prescriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetail" ADD CONSTRAINT "PrescriptionDetail_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceNode" ADD CONSTRAINT "ServiceNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceNode"("nodeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceNode"("nodeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ServiceNode"("nodeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItemConfig" ADD CONSTRAINT "ServiceItemConfig_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_orderingDoctorId_fkey" FOREIGN KEY ("orderingDoctorId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestDetail" ADD CONSTRAINT "ServiceRequestDetail_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestDetail" ADD CONSTRAINT "ServiceRequestDetail_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ServiceItemConfig"("configId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceResult"("resultId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetail" ADD CONSTRAINT "ServiceTemplateDetail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ServiceTemplate"("templateId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetail" ADD CONSTRAINT "ServiceTemplateDetail_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("prescriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_serviceResultId_fkey" FOREIGN KEY ("serviceResultId") REFERENCES "ServiceResult"("resultId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("fileID") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- 4. Function sinh ma nghiep vu ----------
CREATE OR REPLACE FUNCTION generate_record_code()
RETURNS TEXT AS $$
DECLARE
    _month_key TEXT;
    _seq_val INT;
    _result TEXT;
BEGIN
    -- Lấy tháng năm hiện tại (Format: MMYY, ví dụ: 0126)
    _month_key := to_char(now(), 'MMYY');

    -- Kỹ thuật UPSERT:
    -- Nếu tháng này chưa có record -> Insert số 1
    -- Nếu tháng này đã có record -> Tăng lên 1
    INSERT INTO "MedicalRecordSequence" ("monthKey", "currentVal")
    VALUES (_month_key, 1)
    ON CONFLICT ("monthKey") 
    DO UPDATE SET "currentVal" = "MedicalRecordSequence"."currentVal" + 1
    RETURNING "currentVal" INTO _seq_val;

    -- Format kết quả: BA-0126000005
    _result := 'BA-' || _month_key || LPAD(_seq_val::TEXT, 6, '0');

    RETURN _result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sr_gen_request_code()
RETURNS trigger AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  -- Khóa theo transaction để tránh 2 request generate cùng lúc
  PERFORM pg_advisory_xact_lock(hashtext('ServiceRequest_requestCode_gen'));

  -- Lấy thời gian theo VN (đúng giờ HCM)
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  code := 'CLS-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');

  -- Nếu đã tồn tại, nhích sang giây tiếp theo cho đến khi unique
  WHILE EXISTS (SELECT 1 FROM "ServiceRequest" WHERE "requestCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'CLS-' || to_char(ts, 'DDMMYYYY') || '-' || to_char(ts, 'HH24MISS');
  END LOOP;

  NEW."requestCode" := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pres_gen_code()
RETURNS text AS $$
DECLARE
  ts   timestamp;
  code text;
BEGIN
  -- Khóa giao dịch để đảm bảo tính duy nhất khi nhiều người cùng tạo toa
  PERFORM pg_advisory_xact_lock(hashtext('Prescription_prescriptionCode_gen'));

  -- Lấy thời gian hiện tại múi giờ VN
  ts := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh');

  -- Định dạng: TOA-ddMMyyyy-HH24MISS (HH24 để tránh trùng sáng chiều)
  code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');

  -- Nguyên lý chống trùng lặp: Nếu trùng thì cộng thêm 1 giây
  WHILE EXISTS (SELECT 1 FROM "Prescription" WHERE "prescriptionCode" = code) LOOP
    ts := ts + interval '1 second';
    code := 'TOA-' || to_char(ts, 'DDMMYYYY-HH24MISS');
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_generate_medical_record_code()
RETURNS TRIGGER AS $$
DECLARE
    _p_code TEXT;
    _p_numbers TEXT;
    _seq_val INT;
    _month_key TEXT;
    _created_at TIMESTAMPTZ;
    _max_existing INT;
BEGIN
    IF NEW."recordCode" IS NULL OR NEW."recordCode" = '' THEN
        SELECT "patientCode" INTO _p_code FROM "Patient" WHERE "patientId" = NEW."patientId";
        _p_numbers := regexp_replace(_p_code, '^.*-', '');

        _created_at := COALESCE(NEW."createdAt", now());
        _month_key := to_char(_created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        -- ensure sequence is at least the max seq already present in recordCode
        SELECT MAX(CAST(RIGHT("recordCode", 2) AS INT)) INTO _max_existing
        FROM "MedicalRecord"
        WHERE "patientId" = NEW."patientId"
          AND "recordCode" LIKE ('BA-' || _p_numbers || _month_key || '%');

        INSERT INTO "MedicalRecordSequence" ("patientId", "monthKey", "currentVal")
        VALUES (NEW."patientId", _month_key, COALESCE(_max_existing, 0))
        ON CONFLICT ("patientId", "monthKey")
        DO UPDATE SET "currentVal" = GREATEST("MedicalRecordSequence"."currentVal", COALESCE(_max_existing, 0))
        RETURNING "currentVal" INTO _seq_val;

        -- increment sequence for this new record
        UPDATE "MedicalRecordSequence"
        SET "currentVal" = "currentVal" + 1
        WHERE "patientId" = NEW."patientId" AND "monthKey" = _month_key
        RETURNING "currentVal" INTO _seq_val;

        NEW."recordCode" := 'BA-' || _p_numbers || _month_key || LPAD(_seq_val::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_generate_service_request_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
    _cls_count INT;
BEGIN
    IF NEW."requestCode" IS NULL OR NEW."requestCode" = '' THEN
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";
        _ba_numbers := SUBSTRING(_ba_code FROM 4); -- Bỏ 'BA-'

        SELECT COUNT(*) + 1 INTO _cls_count FROM "ServiceRequest" WHERE "recordId" = NEW."recordId";

        NEW."requestCode" := 'CLS-' || _ba_numbers || '-' || LPAD(_cls_count::TEXT, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_generate_prescription_code()
RETURNS TRIGGER AS $$
DECLARE
    _ba_code TEXT;
    _ba_numbers TEXT;
BEGIN
    IF NEW."prescriptionCode" IS NULL OR NEW."prescriptionCode" = '' THEN
        SELECT "recordCode" INTO _ba_code FROM "MedicalRecord" WHERE "recordId" = NEW."recordId";
        _ba_numbers := SUBSTRING(_ba_code FROM 4);

        NEW."prescriptionCode" := 'TOA-' || _ba_numbers;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_generate_patient_code()
RETURNS TRIGGER AS $$
DECLARE
    _clinic_code TEXT;
    _month_key TEXT;
    _seq_val INT;
BEGIN
    IF NEW."patientCode" IS NULL OR NEW."patientCode" = '' THEN
        SELECT "clinicCode" INTO _clinic_code FROM "Clinic" WHERE "clinicId" = NEW."clinicId";
        IF _clinic_code IS NULL THEN _clinic_code := 'BN'; END IF;

        _month_key := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'MMYY');

        INSERT INTO "PatientSequence" ("clinicId", "monthKey", "currentVal")
        VALUES (NEW."clinicId", _month_key, 1)
        ON CONFLICT ("clinicId", "monthKey") 
        DO UPDATE SET "currentVal" = "PatientSequence"."currentVal" + 1
        RETURNING "currentVal" INTO _seq_val;

        NEW."patientCode" := _clinic_code || '-' || _month_key || LPAD(_seq_val::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- 5. Trigger ----------
DROP TRIGGER IF EXISTS trg_patient_gen_code ON "Patient";
CREATE TRIGGER trg_patient_gen_code BEFORE INSERT ON "Patient" FOR EACH ROW EXECUTE FUNCTION trg_generate_patient_code();

DROP TRIGGER IF EXISTS ensure_medical_record_code ON "MedicalRecord";
CREATE TRIGGER ensure_medical_record_code BEFORE INSERT ON "MedicalRecord" FOR EACH ROW EXECUTE FUNCTION trg_generate_medical_record_code();

DROP TRIGGER IF EXISTS trg_sr_gen_request_code ON "ServiceRequest";
CREATE TRIGGER trg_sr_gen_request_code BEFORE INSERT ON "ServiceRequest" FOR EACH ROW EXECUTE FUNCTION trg_generate_service_request_code();

DROP TRIGGER IF EXISTS trg_pres_gen_code ON "Prescription";
CREATE TRIGGER trg_pres_gen_code BEFORE INSERT ON "Prescription" FOR EACH ROW EXECUTE FUNCTION trg_generate_prescription_code();
