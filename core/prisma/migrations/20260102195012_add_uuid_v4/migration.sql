CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AlterTable
ALTER TABLE "ClinicalExaminations" ALTER COLUMN "ExamID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "FollowUps" ALTER COLUMN "FollowUpID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "InventoryLogs" ALTER COLUMN "LogID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "MedicalRecords" ALTER COLUMN "RecordID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "Medicines" ALTER COLUMN "MedicineID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "PatientRelatives" ALTER COLUMN "RelativeID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "Patients" ALTER COLUMN "PatientID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "PrescriptionDetails" ALTER COLUMN "DetailID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "PrescriptionTemplateDetails" ALTER COLUMN "TemplateDetailID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "PrescriptionTemplates" ALTER COLUMN "TemplateID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "Prescriptions" ALTER COLUMN "PrescriptionID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "Roles" ALTER COLUMN "RoleID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceItemConfigs" ALTER COLUMN "ConfigID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceItems" ALTER COLUMN "ItemID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceNodes" ALTER COLUMN "NodeID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceRequestDetails" ALTER COLUMN "RequestDetailID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceRequests" ALTER COLUMN "RequestID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceResults" ALTER COLUMN "ResultID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceTemplateDetails" ALTER COLUMN "TemplateDetailID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "ServiceTemplates" ALTER COLUMN "TemplateID" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "UserID" SET DEFAULT uuid_generate_v4();
