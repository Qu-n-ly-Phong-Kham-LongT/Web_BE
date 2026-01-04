/*
  Warnings:

  - You are about to drop the `ClinicalExaminations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Clinics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FollowUps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ICD10_Dictionary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventoryLogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalRecords` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Medicines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PatientRelatives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrescriptionDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrescriptionTemplateDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrescriptionTemplates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prescriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshTokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceItemConfigs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceItems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceNodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceRequestDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceRequests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceResults` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceTemplateDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceTemplates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicalExaminations" DROP CONSTRAINT "ClinicalExaminations_RecordID_fkey";

-- DropForeignKey
ALTER TABLE "FollowUps" DROP CONSTRAINT "FollowUps_RecordID_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLogs" DROP CONSTRAINT "InventoryLogs_MedicineID_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLogs" DROP CONSTRAINT "InventoryLogs_PerformedBy_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecords" DROP CONSTRAINT "MedicalRecords_DoctorID_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecords" DROP CONSTRAINT "MedicalRecords_PatientID_fkey";

-- DropForeignKey
ALTER TABLE "PatientRelatives" DROP CONSTRAINT "PatientRelatives_PatientID_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionDetails" DROP CONSTRAINT "PrescriptionDetails_MedicineID_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionDetails" DROP CONSTRAINT "PrescriptionDetails_PrescriptionID_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTemplateDetails" DROP CONSTRAINT "PrescriptionTemplateDetails_MedicineID_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTemplateDetails" DROP CONSTRAINT "PrescriptionTemplateDetails_TemplateID_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTemplates" DROP CONSTRAINT "PrescriptionTemplates_CreatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Prescriptions" DROP CONSTRAINT "Prescriptions_RecordID_fkey";

-- DropForeignKey
ALTER TABLE "RefreshTokens" DROP CONSTRAINT "RefreshTokens_UserID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceItemConfigs" DROP CONSTRAINT "ServiceItemConfigs_ItemID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceItems" DROP CONSTRAINT "ServiceItems_CategoryID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceItems" DROP CONSTRAINT "ServiceItems_TypeID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceNodes" DROP CONSTRAINT "ServiceNodes_ParentID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequestDetails" DROP CONSTRAINT "ServiceRequestDetails_ItemID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequestDetails" DROP CONSTRAINT "ServiceRequestDetails_RequestID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequests" DROP CONSTRAINT "ServiceRequests_OrderingDoctorID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequests" DROP CONSTRAINT "ServiceRequests_RecordID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceResults" DROP CONSTRAINT "ServiceResults_DetailID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceResults" DROP CONSTRAINT "ServiceResults_PerformingDoctorID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceTemplateDetails" DROP CONSTRAINT "ServiceTemplateDetails_ItemID_fkey";

-- DropForeignKey
ALTER TABLE "ServiceTemplateDetails" DROP CONSTRAINT "ServiceTemplateDetails_TemplateID_fkey";

-- DropForeignKey
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_RoleID_fkey";

-- DropForeignKey
ALTER TABLE "UserRoles" DROP CONSTRAINT "UserRoles_UserID_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_Clinic_ID_fkey";

-- DropTable
DROP TABLE "ClinicalExaminations";

-- DropTable
DROP TABLE "Clinics";

-- DropTable
DROP TABLE "FollowUps";

-- DropTable
DROP TABLE "ICD10_Dictionary";

-- DropTable
DROP TABLE "InventoryLogs";

-- DropTable
DROP TABLE "MedicalRecords";

-- DropTable
DROP TABLE "Medicines";

-- DropTable
DROP TABLE "PatientRelatives";

-- DropTable
DROP TABLE "Patients";

-- DropTable
DROP TABLE "PrescriptionDetails";

-- DropTable
DROP TABLE "PrescriptionTemplateDetails";

-- DropTable
DROP TABLE "PrescriptionTemplates";

-- DropTable
DROP TABLE "Prescriptions";

-- DropTable
DROP TABLE "RefreshTokens";

-- DropTable
DROP TABLE "Roles";

-- DropTable
DROP TABLE "ServiceItemConfigs";

-- DropTable
DROP TABLE "ServiceItems";

-- DropTable
DROP TABLE "ServiceNodes";

-- DropTable
DROP TABLE "ServiceRequestDetails";

-- DropTable
DROP TABLE "ServiceRequests";

-- DropTable
DROP TABLE "ServiceResults";

-- DropTable
DROP TABLE "ServiceTemplateDetails";

-- DropTable
DROP TABLE "ServiceTemplates";

-- DropTable
DROP TABLE "UserRoles";

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "Role" (
    "roleId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "roleName" "UserRoleEnum" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "clinicId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clinicName" VARCHAR(255),
    "address" VARCHAR(255),
    "phone" VARCHAR(255),
    "email" VARCHAR(150),
    "clinicCode" VARCHAR(100),

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("clinicId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150),
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" UUID NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "token" VARCHAR(500) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "dob" TIMESTAMP(3),
    "patientCategory" "PatientCategory" DEFAULT 'DichVu',
    "phone" TEXT,
    "email" TEXT,
    "identityCard" TEXT,
    "insuranceNumber" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patientId")
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
CREATE TABLE "MedicalRecord" (
    "recordId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordCode" TEXT,
    "patientId" UUID,
    "doctorId" UUID,
    "diagnoses" JSONB,
    "evidenceBasedDiagnosis" BOOLEAN DEFAULT false,
    "doctorAdvice" TEXT,
    "treatmentNote" TEXT,
    "consultationFee" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("recordId")
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
    "clinicalExamination" TEXT,
    "pregnancyStatus" "PregnancyStatus" DEFAULT 'None',
    "pregnancyWeeks" INTEGER,
    "drugAllergies" TEXT,
    "clinicalNotes" TEXT,
    "examinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "examinedBy" UUID,

    CONSTRAINT "ClinicalExamination_pkey" PRIMARY KEY ("examId")
);

-- CreateTable
CREATE TABLE "Icd10Dictionary" (
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Icd10Dictionary_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "prescriptionId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recordId" UUID,
    "pdfPath" TEXT,
    "fileName" TEXT,
    "note" TEXT,
    "totalPrice" DECIMAL(65,30),
    "paymentStatus" "PaymentStatus" DEFAULT 'Unpaid',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("prescriptionId")
);

-- CreateTable
CREATE TABLE "PrescriptionDetail" (
    "detailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prescriptionId" UUID,
    "medicineId" UUID,
    "unit" TEXT,
    "frequencyPerDay" INTEGER,
    "quantityPerTime" DOUBLE PRECISION,
    "administrationRoute" TEXT,
    "timing" TEXT,
    "quantity" INTEGER,
    "daysToTake" INTEGER,
    "price" DOUBLE PRECISION,
    "isInsuranceCovered" BOOLEAN DEFAULT false,
    "appliedExportPrice" DECIMAL(65,30),
    "note" TEXT,

    CONSTRAINT "PrescriptionDetail_pkey" PRIMARY KEY ("detailId")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplate" (
    "templateId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateName" TEXT,
    "description" TEXT,
    "createdBy" UUID,

    CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplateDetail" (
    "templateDetailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateId" UUID,
    "medicineId" UUID,
    "defaultFrequency" INTEGER,
    "defaultQuantityPerTime" DOUBLE PRECISION,
    "defaultRoute" TEXT,
    "defaultTiming" TEXT,

    CONSTRAINT "PrescriptionTemplateDetail_pkey" PRIMARY KEY ("templateDetailId")
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

    CONSTRAINT "ServiceNode_pkey" PRIMARY KEY ("nodeId")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "itemId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "itemCode" TEXT,
    "name" TEXT,
    "categoryId" UUID,
    "typeId" UUID,
    "unit" TEXT,
    "specimen" TEXT,
    "prepNote" TEXT,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "ServiceItemConfig" (
    "configId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "itemId" UUID,
    "configCode" TEXT,
    "displayName" TEXT,
    "inputType" "InputType" DEFAULT 'Boolean',
    "groupName" TEXT,
    "metaData" JSONB,

    CONSTRAINT "ServiceItemConfig_pkey" PRIMARY KEY ("configId")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "requestId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestCode" TEXT,
    "recordId" UUID,
    "orderingDoctorId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

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
    "resultCode" TEXT,
    "description" TEXT,
    "conclusion" TEXT,
    "note" TEXT,
    "isPdf" BOOLEAN DEFAULT false,
    "pdfUrl" TEXT,
    "performingDoctorId" UUID,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceResult_pkey" PRIMARY KEY ("resultId")
);

-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "templateId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateName" TEXT,
    "description" TEXT,
    "createdBy" UUID,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateTable
CREATE TABLE "ServiceTemplateDetail" (
    "templateDetailId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "templateId" UUID,
    "itemId" UUID,
    "note" TEXT,

    CONSTRAINT "ServiceTemplateDetail_pkey" PRIMARY KEY ("templateDetailId")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "medicineId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "medicineCode" TEXT,
    "medicineName" TEXT,
    "activeIngredient" TEXT,
    "isInsuranceCovered" BOOLEAN DEFAULT false,
    "medicineCodeBhyt" TEXT,
    "insurancePrice" DECIMAL(65,30),
    "baseUnit" TEXT,
    "totalQuantity" INTEGER DEFAULT 0,
    "sellPrice" DECIMAL(65,30),
    "note" TEXT,
    "supplier" TEXT,
    "sideEffects" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("medicineId")
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "logId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "medicineId" UUID,
    "type" "InventoryLogType",
    "quantity" INTEGER,
    "quantityBase" INTEGER,
    "unitPrice" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),
    "performedBy" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_email_key" ON "Clinic"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_clinicCode_key" ON "Clinic"("clinicCode");

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
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phone_key" ON "Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_identityCard_key" ON "Patient"("identityCard");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_insuranceNumber_key" ON "Patient"("insuranceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRelative_identityCard_key" ON "PatientRelative"("identityCard");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_recordCode_key" ON "MedicalRecord"("recordCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalExamination_recordId_key" ON "ClinicalExamination"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_recordId_key" ON "Prescription"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_recordId_key" ON "FollowUp"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceNode_code_key" ON "ServiceNode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItem_itemCode_key" ON "ServiceItem"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestCode_key" ON "ServiceRequest"("requestCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceResult_detailId_key" ON "ServiceResult"("detailId");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_medicineCode_key" ON "Medicine"("medicineCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRelative" ADD CONSTRAINT "PatientRelative_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetail" ADD CONSTRAINT "PrescriptionDetail_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("prescriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionDetail" ADD CONSTRAINT "PrescriptionDetail_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("templateId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "ServiceRequestDetail"("requestDetailId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResult" ADD CONSTRAINT "ServiceResult_performingDoctorId_fkey" FOREIGN KEY ("performingDoctorId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetail" ADD CONSTRAINT "ServiceTemplateDetail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ServiceTemplate"("templateId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplateDetail" ADD CONSTRAINT "ServiceTemplateDetail_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ServiceItem"("itemId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
