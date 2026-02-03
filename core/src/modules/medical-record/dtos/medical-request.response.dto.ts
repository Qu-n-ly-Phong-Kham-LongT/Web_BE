import { MedicalDiagnosisDto } from "./medical-record.request.dto"

export interface MedicalRecordResponseDto {
  recordId: string;
  recordCode: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  evidenceBasedDiagnosis?: boolean;
  diagnoses?: MedicalDiagnosisDto;
  doctorAdvice?: string;
  treatmentNote?: string;
  consultationFee: number;
  createdAt: Date;
  updatedAt: Date;
}
