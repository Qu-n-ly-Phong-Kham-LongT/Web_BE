import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import { PatientAllergyItemDto } from "../../patient/dtos/patient-allergy.response.dto";
import { AllergyItemDto } from "../../clinical-examination/dtos/clinical-examination.request.dto";

export interface MedicalRecordPrintMedicineDto {
  medicineId: string;
  medicineName: string;
  quantity: string;
  unit: string;
  usage: string;
}

export interface MedicalRecordPrintPrescriptionDetailDto {
  medicineId: string;
  medicineName: string;
  frequencyPerDay: string;
  quantityPerTime: string;
  quantity: string;
  unit: string;
  administrationRoute: string;
  timing: string;
  daysToTake: string;
  note: string;
  isInsuranceCovered: string;
}

export interface MedicalRecordPrintServiceRequestHeaderDto {
  requestIndex: string;
  requestId: string;
  requestCode: string;
  recordId: string;
  recordCode: string;
  orderingDoctorId: string;
  diagnoses: any;
  isPatientRequested: string;
  receiveResultAtClinic: string;
  isForFollowUp: string;
  note: string;
  createdAt: string;
  patientId: string;
  resultDivider: string;
  details: MedicalRecordPrintServiceRequestDetailDto[];
}

export interface MedicalRecordPrintServiceRequestDetailDto {
  requestId: string;
  requestDetailId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  selectedOptions: any;
  results: MedicalRecordPrintServiceRequestResultDto[];
}

export interface MedicalRecordPrintServiceRequestSelectedConfigDto {
  requestId: string;
  requestDetailId: string;
  itemId: string;
  configId: string;
  configCode: string;
  displayName: string;
  selectedValues: string[];
  totalSurcharge: string;
}

export interface MedicalRecordPrintServiceRequestResultDto {
  resultId: string;
  detailId: string;
  requestId: string;
  requestDetailId: string;
  itemId: string;
  configId: string;
  indicatorName: string;
  valueString: string;
  valueNumber: string;
  unit: string;
  executedAt: string;
}

export interface MedicalRecordPrintDto {
  barcode?: Buffer | string | null;
  recordId: string;
  recordCode: string;
  recordDate: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhones: string;
  doctorName: string;
  evidenceBasedDiagnosis: string;
  diagnosisMainCode: string;
  diagnosisMainDescription: string;
  diagnosisMainNote: string;
  diagnosisSecondary: MedicalDiagnosisDto["secondary"];
  diagnosisText: string;
  doctorAdvice: string;
  treatmentNote: string;
  consultationFee: string;
  recordCreatedAt: string;
  recordUpdatedAt: string;
  patientCode: string;
  fullName: string;
  gender: string;
  dob: string;
  age: string;
  patientCategory: string;
  phone: string;
  email: string;
  identityCard: string;
  insuranceNumber: string;
  occupation: string;
  address: string;
  patientCreatedAt: string;
  patientUpdatedAt: string;
  patientAllergies: PatientAllergyItemDto[];
  examId: string;
  examRecordId: string;
  reasonForVisit: string;
  medicalHistory: string;
  pastMedicalHistory: string;
  clinicalExamination: string;
  heartRate: string;
  pressure: string;
  temperature: string;
  height: string;
  weight: string;
  bmi: string;
  pregnancyStatus: string;
  weeks: string;
  hasPoorAppetite: string;
  hasWeightLoss: string;
  hasHealthInsurance: string;
  isBreastfeeding: string;
  clinicalNotes: string;
  examinedAt: string;
  examinedBy: string;
  allergies: AllergyItemDto[];
  prescriptionId: string;
  prescriptionNote: string;
  totalPrice: string;
  status: string;
  prescriptionCreatedAt: string;
  prescriptionUpdatedAt: string;
  prescriptionDetails: MedicalRecordPrintPrescriptionDetailDto[];
  medicines: MedicalRecordPrintMedicineDto[];
  requests: MedicalRecordPrintServiceRequestHeaderDto[];
  requestSelectedConfigs: MedicalRecordPrintServiceRequestSelectedConfigDto[];
  appointmentDate: string;
  appointmentSession: string;
  appointmentReason: string;
}
