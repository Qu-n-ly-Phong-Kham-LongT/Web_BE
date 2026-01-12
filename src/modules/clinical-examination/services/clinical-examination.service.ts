import { ClinicalExamination, PatientAllergy, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { ClinicalExaminationRequestDto, AllergyItemDto } from "../dtos/clinical-examination.request.dto";
import { ClinicalExaminationRepository } from "../repositories/clinical-examination.repository";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { PatientRepository } from "../../patient/repositories/patient.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicalExaminationResponseDto } from "../dtos/clinical-examination.response.dto";

export class ClinicalExaminationService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private clinicalExaminationRepository = new ClinicalExaminationRepository();
  private patientRepository = new PatientRepository();

  public async upsertClinicalExamination(
    payload: ClinicalExaminationRequestDto,
    doctorId: string,
    clinicId: string
  ): Promise<ClinicalExaminationResponseDto> {
    const record = await this.medicalRecordRepository.findById(payload.recordId);
    if (!record) throw new BaseError(404, "Không tìm thấy bệnh án");
    if (record.clinicId && record.clinicId !== clinicId) {
      throw new BaseError(403, "Bệnh án không thuộc phòng khám của bạn");
    }

    const examData: Prisma.ClinicalExaminationUncheckedCreateInput = {
      recordId: payload.recordId,
      examinedBy: doctorId,
      userId: doctorId,
      reasonForVisit: payload.reasonForVisit ?? null,
      medicalHistory: payload.medicalHistory ?? null,
      pastMedicalHistory: payload.pastMedicalHistory ?? null,
      clinicalExamination: payload.clinicalExamination ?? null,
      heartRate: payload.heartRate ?? null,
      bloodPressure: payload.bloodPressure ?? null,
      temperature: payload.temperature ?? null,
      height: payload.height ?? null,
      weight: payload.weight ?? null,
      pregnancyStatus: payload.pregnancyStatus ?? null,
      pregnancyWeeks: payload.pregnancyWeeks ?? null,
      hasPoorAppetite: payload.hasPoorAppetite,
      hasWeightLoss: payload.hasWeightLoss,
      clinicalNotes: payload.clinicalNotes ?? null,
    };

    const { savedExam, allergyRecords } = await prisma.$transaction(async (tx) => {
      const existingExam = await this.clinicalExaminationRepository.findByRecordId(payload.recordId, tx);

      const savedExam = existingExam
        ? await this.clinicalExaminationRepository.updateByRecordId(
            payload.recordId,
            examData as Prisma.ClinicalExaminationUncheckedUpdateInput,
            tx
          )
        : await this.clinicalExaminationRepository.createExamination(examData, tx);

      let allergyRecords: PatientAllergy[] = [];
      if (record.patientId) {
        if (payload.allergies) {
          const saved = await this.patientRepository.upsertAllergies(record.patientId, payload.allergies, tx);
          allergyRecords = [saved];
        } else {
          allergyRecords = await this.patientRepository.findAllergiesByPatientId(record.patientId, tx);
        }
      }

      return { savedExam, allergyRecords };
    });

    return this.mapToClinicalExaminationResponse(savedExam, allergyRecords);
  }

  private mapToClinicalExaminationResponse(
    exam: ClinicalExamination,
    allergies: PatientAllergy[]
  ): ClinicalExaminationResponseDto {
    const allergyItems: AllergyItemDto[] = [];
    for (const record of allergies || []) {
      const data = (record.data as any) || [];
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          allergyItems.push({
            drug: item?.drug ?? "",
            reaction: item?.reaction ?? null,
          });
        });
      }
    }

    return {
      examId: exam.examId,
      recordId: exam.recordId ?? "",
      reasonForVisit: exam.reasonForVisit ?? null,
      medicalHistory: exam.medicalHistory ?? null,
      pastMedicalHistory: exam.pastMedicalHistory ?? null,
      clinicalExamination: exam.clinicalExamination ?? null,
      heartRate: exam.heartRate ?? null,
      bloodPressure: exam.bloodPressure ?? null,
      temperature: exam.temperature ?? null,
      height: exam.height ?? null,
      weight: exam.weight ?? null,
      pregnancyStatus: exam.pregnancyStatus ?? null,
      pregnancyWeeks: exam.pregnancyWeeks ?? null,
      hasPoorAppetite: exam.hasPoorAppetite ?? null,
      hasWeightLoss: exam.hasWeightLoss ?? null,
      clinicalNotes: exam.clinicalNotes ?? null,
      examinedAt: exam.examinedAt ?? null,
      examinedBy: exam.examinedBy ?? null,
      allergies: allergyItems,
    };
  }
}
