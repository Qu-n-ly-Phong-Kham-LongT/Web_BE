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
      this.userRepository.findUserById(createData.doctorId || ""),
      this.patientRepository.findPatientById(createData.patientId || ""),
      this.clinicRepository.findClinicById(createData.clinicId ?? ''),
    ]);
    if (!doctor) throw new BaseError(404, "Không tìm thấy bác sĩ.");
    if (!patient) throw new BaseError(404, "Bệnh nhân không tồn tại");
    if (!clinic) throw new BaseError(404, "Phòng khám không tồn tại");

    if (doctor.clinicId !== createData.clinicId) {
      throw new BaseError(403, "Bác sĩ không có quyền tạo bệnh án của phòng khám khác.");
    }

    // Kiem tra trong ngay da co benh an cua benh nhan trong phong kham chua
    // Tinh moc ngay theo UTC de khop voi thoi gian luu DB, tranh nham sang ngay hien tai khi server/DB khac mui gio
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const existingRecord = await this.medicalRecordRepository.findExistingRecord(
      createData.patientId || "",
      createData.clinicId ?? "",
      startOfDay,
      endOfDay
    );
    if (existingRecord) {
      throw new BaseError(
        409,
        "Bệnh nhân này đã có bệnh án trong hôm nay, vui lòng tiếp tục với bệnh án hiện tại."
      );
    }

    const record = await this.medicalRecordRepository.createRecord({
      patientId: createData.patientId,
      doctorId: createData.doctorId,
      clinicId: createData.clinicId,
      consultationFee: createData.consultationFee ?? 0,
    });

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

    const storedAllergies = await this.patientRepository.findAllergiesByPatientId(createData.patientId || "");
    const allergies: PatientAllergyResponseDto[] = storedAllergies.map((a) => ({
      allergyID: a.allergyId,
      patientID: a.patientId,
      drug: (a.data as any)?.drug ?? null,
      reaction: (a.data as any)?.reaction ?? null,
    }));

    return { record, examinationId, allergies };
  }
}
