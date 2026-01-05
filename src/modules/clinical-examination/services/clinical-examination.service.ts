import { ClinicalExamination, Prisma } from "@prisma/client";
import { ClinicalExaminationRequestDto } from "../dtos/clinical-examination.request.dto";
import { ClinicalExaminationRepository } from "../repositories/clinical-examination.repository";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { PatientRepository } from "../../patient/repositories/patient.repository";
import { BaseError } from "../../../utils/base-error.util";
import { PatientAllergyResponseDto } from "../../patient/dtos/patient-allergy.response.dto";

export class ClinicalExaminationService {
  private clinicalExaminationRepository = new ClinicalExaminationRepository();
  private medicalRecordRepository = new MedicalRecordRepository();
  private patientRepository = new PatientRepository();

  public async upsertClinicalExamination(
    payload: ClinicalExaminationRequestDto,
    doctorId: string,
    clinicId: string
  ): Promise<{ examination: ClinicalExamination; allergies: PatientAllergyResponseDto[] }> {
    const record = await this.medicalRecordRepository.findById(payload.recordId);
    if (!record) throw new BaseError(404, "Không tìm thấy bệnh án");
    if (record.clinicId && record.clinicId !== clinicId) {
      throw new BaseError(403, "Bệnh án không thuộc phòng khám của bạn");
    }
    if (record.doctorId && record.doctorId !== doctorId) {
      throw new BaseError(403, "Chỉ bác sĩ phụ trách mới được khám lâm sàng hồ sơ này");
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
      clinicalNotes: payload.clinicalNotes ?? null,
    };

    const existing = await this.clinicalExaminationRepository.findByRecordId(payload.recordId);
    const examination = existing
      ? await this.clinicalExaminationRepository.updateByRecordId(
          payload.recordId,
          examData as Prisma.ClinicalExaminationUncheckedUpdateInput
        )
      : await this.clinicalExaminationRepository.createExamination(examData);

    let allergies: PatientAllergyResponseDto[] = [];
    if (record.patientId) {
      if (payload.allergies) {
        await this.patientRepository.replaceAllergies(record.patientId, payload.allergies);
      }
      const stored = await this.patientRepository.findAllergiesByPatientId(record.patientId);
      allergies = stored.map((a) => ({
        allergyID: a.allergyId,
        patientID: a.patientId,
        drug: (a.data as any)?.drug ?? null,
        reaction: (a.data as any)?.reaction ?? null,
      }));
    }

    return { examination, allergies };
  }
}
