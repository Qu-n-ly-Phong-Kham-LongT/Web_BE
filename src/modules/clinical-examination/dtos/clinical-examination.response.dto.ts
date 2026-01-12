import Joi from "joi";
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
  bmi: number | null;
  pregnancyStatus: PregnancyStatus | null;
  pregnancyWeeks: number | null;
  hasPoorAppetite: boolean | null;
  hasWeightLoss: boolean | null;
  clinicalNotes: string | null;
  examinedAt: Date | null;
  examinedBy: string | null;
  allergies: AllergyItemDto[];
}

export const ClinicalExaminationResponseSchema =
  Joi.object<ClinicalExaminationResponseDto>({
    examId: Joi.string(),
    recordId: Joi.string(),
    reasonForVisit: Joi.string().allow(null),
    medicalHistory: Joi.string().allow(null),
    pastMedicalHistory: Joi.string().allow(null),
    clinicalExamination: Joi.string().allow(null),
    heartRate: Joi.number().allow(null),
    bloodPressure: Joi.string().allow(null),
    temperature: Joi.number().allow(null),
    height: Joi.number().allow(null),
    weight: Joi.number().allow(null),
    bmi: Joi.number().allow(null),
    pregnancyStatus: Joi.string().allow(null),
    pregnancyWeeks: Joi.number().allow(null),
    hasPoorAppetite: Joi.boolean().allow(null),
    hasWeightLoss: Joi.boolean().allow(null),
    clinicalNotes: Joi.string().allow(null),
    examinedAt: Joi.date().allow(null),
    examinedBy: Joi.string().allow(null),
    allergies: Joi.array().items(
      Joi.object({
        drug: Joi.string(),
        reaction: Joi.string().allow(null),
      })
    ),
  }).required();

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
    bmi: exam.bmi,
    pregnancyStatus: exam.pregnancyStatus,
    pregnancyWeeks: exam.pregnancyWeeks,
    hasPoorAppetite: exam.hasPoorAppetite ?? null,
    hasWeightLoss: exam.hasWeightLoss ?? null,
    clinicalNotes: exam.clinicalNotes,
    examinedAt: exam.examinedAt,
    examinedBy: exam.examinedBy,
    
    allergies: allergyList,
  };
};
