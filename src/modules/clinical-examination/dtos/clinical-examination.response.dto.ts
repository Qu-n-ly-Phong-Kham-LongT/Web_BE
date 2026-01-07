import { PregnancyStatus, ClinicalExamination, PatientAllergy } from "@prisma/client";
import { AllergyItemDto } from "./clinical-examination.request.dto";

export interface ClinicalExaminationResponseDto {
  examId: string;
  recordId: string;
  reasonForVisit: string | null;
  medicalHistory: string | null;
  pastMedicalHistory: string | null;
  clinicalExamination: string | null;
  heartRate: number | null;
  bloodPressure: string | null;
  temperature: number | null;
  height: number | null;
  weight: number | null;
  pregnancyStatus: PregnancyStatus | null;
  pregnancyWeeks: number | null;
  clinicalNotes: string | null;
  examinedAt: Date | null;
  examinedBy: string | null;
  allergies: AllergyItemDto[];
}

export const mapToClinicalExaminationResponse = (
  exam: ClinicalExamination,
  allergyRecord: PatientAllergy | null
): ClinicalExaminationResponseDto => {
  
  let allergyList: AllergyItemDto[] = [];
  
  if (allergyRecord && Array.isArray(allergyRecord.data)) {
    allergyList = (allergyRecord.data as any[]).map((item) => ({
      drug: item.drug,
      reaction: item.reaction,
    }));
  }
  return {
    examId: exam.examId,
    recordId: exam.recordId || "",
    reasonForVisit: exam.reasonForVisit,
    medicalHistory: exam.medicalHistory,
    pastMedicalHistory: exam.pastMedicalHistory,
    clinicalExamination: exam.clinicalExamination,
    heartRate: exam.heartRate,
    bloodPressure: exam.bloodPressure,
    temperature: exam.temperature,
    height: exam.height,
    weight: exam.weight,
    pregnancyStatus: exam.pregnancyStatus,
    pregnancyWeeks: exam.pregnancyWeeks,
    clinicalNotes: exam.clinicalNotes,
    examinedAt: exam.examinedAt,
    examinedBy: exam.examinedBy,
    
    allergies: allergyList,
  };
};