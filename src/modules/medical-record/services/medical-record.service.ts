import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import { BasicMedicalRecordRequestDto } from "../dtos/medical-record.request.dto";
import { MedicalRecord } from "@prisma/client";
import { UserRepository } from "../../users/repositories/user.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicRepository } from "../../clinic/repositories/clinic.repository";
import { PatientRepository } from "../../patient/repositories/patient.repository";
import { ClinicalExaminationRepository } from "../../clinical-examination/repositories/clinical-examination.repository";
import { PatientAllergyResponseDto } from "../../patient/dtos/patient-allergy.response.dto";

export class MedicalRecordService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private userRepository = new UserRepository();
  private clinicRepository = new ClinicRepository();
  private patientRepository = new PatientRepository();
  private clinicalExaminationRepository = new ClinicalExaminationRepository();

  public async createBasicMedicalRecord(
    createData: BasicMedicalRecordRequestDto
  ): Promise<{ record: MedicalRecord; examinationId: string; allergies: PatientAllergyResponseDto[] }> {
    const [doctor, patient, clinic] = await Promise.all([
      this.userRepository.findUserById(createData.doctorId),
      this.patientRepository.findPatientById(createData.patientId),
      this.clinicRepository.findClinicById(createData.clinicId),
    ]);
    if (!doctor) throw new BaseError(404, "Không tìm thấy bác sĩ.");
    if (!patient) throw new BaseError(404, "Bệnh nhân không tồn tại");
    if (!clinic) throw new BaseError(404, "Phòng khám không tồn tại");

    if (doctor.clinicId !== createData.clinicId) {
      throw new BaseError(403, "Bác sĩ không có quyền tạo bệnh án của phòng khám khác.");
    }

    const record = await this.medicalRecordRepository.createRecord({
      patientId: createData.patientId,
      doctorId: createData.doctorId,
      clinicId: createData.clinicId,
      consultationFee: createData.consultationFee ?? 0,
    });

    // Khởi tạo khám lâm sàng rỗng nếu chưa có
    let examinationId: string;
    const existingExam = await this.clinicalExaminationRepository.findByRecordId(record.recordId);
    if (existingExam) {
      examinationId = existingExam.examId;
    } else {
      const exam = await this.clinicalExaminationRepository.createExamination({
        recordId: record.recordId,
        examinedBy: createData.doctorId,
        userId: createData.doctorId,
      });
      examinationId = exam.examId;
    }

    // Lấy allergies hiện có
    const storedAllergies = await this.patientRepository.findAllergiesByPatientId(createData.patientId);
    const allergies: PatientAllergyResponseDto[] = storedAllergies.map((a) => ({
      allergyID: a.allergyId,
      patientID: a.patientId,
      drug: (a.data as any)?.drug ?? null,
      reaction: (a.data as any)?.reaction ?? null,
    }));

    return { record, examinationId, allergies };
  }
}
