import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import { BasicMedicalRecordRequestDto } from "../dtos/medical-record.request.dto";
import { MedicalRecord } from "@prisma/client";
import { UserRepository } from "../../users/repositories/user.repository";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicRepository } from "../../clinic/repositories/clinic.repository";
import { PatientRepository } from "../../patient/repositories/patient.repository";
import { ClinicalExaminationRepository } from "../../clinical-examination/repositories/clinical-examination.repository";
import { PatientAllergyResponseDto } from "../../patient/dtos/patient-allergy.response.dto";
import { SharedRepository } from "../../shared/repositories/shared.repository";
import { FullMedicalRecordDto } from "../../shared/dtos/medical-record-detail.dto";
import { getUtcDayRangeForTimeZone } from "../../../utils/date.util";
import {
  ServiceRequestRepository,
  ServiceRequestWithDetails,
} from "../../service-request/repositories/service-request.repository";

export class MedicalRecordService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private userRepository = new UserRepository();
  private clinicRepository = new ClinicRepository();
  private patientRepository = new PatientRepository();
  private clinicalExaminationRepository = new ClinicalExaminationRepository();
  private sharedRepository = new SharedRepository();
  private serviceRequestRepository = new ServiceRequestRepository();

  public async createBasicMedicalRecord(
    createData: BasicMedicalRecordRequestDto
  ): Promise<{
    record: MedicalRecord;
    examinationId: string;
    allergies: PatientAllergyResponseDto[];
    transferredServiceRequests: {
      transferred: number;
      requests: ServiceRequestWithDetails[];
    };
  }> {
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

    const { startUtc, endUtc } = getUtcDayRangeForTimeZone(
      new Date(),
      "Asia/Ho_Chi_Minh"
    );

    const existingRecord = await this.medicalRecordRepository.findExistingRecord(
      createData.patientId || "",
      createData.clinicId ?? "",
      startUtc,
      endUtc
    );
    if (existingRecord) {
      throw new BaseError(
        409,
        "Hôm nay BN đã có bệnh án, hãy tiếp tục với bệnh án cũ."
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
    const allergies: PatientAllergyResponseDto[] = storedAllergies.map((a) => {
      const data = (a.data as any) || [];
      const items = Array.isArray(data) ? data : [data];
      return {
        allergyID: a.allergyId,
        patientID: a.patientId,
        data: items.map((item: any) => ({
          drug: item?.drug ?? null,
          reaction: item?.reaction ?? null,
        })),
      };
    });

    const transferredServiceRequests =
      await this.serviceRequestRepository.transferFollowUpRequestsToRecord(
      createData.patientId || "",
      record.recordId,
    );

    return { record, examinationId, allergies, transferredServiceRequests };
  }

  public async getMedicalRecordsByPatientId(
    patientId: string,
    clinicId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<FullMedicalRecordDto[]> {
    // Kiểm tra bệnh nhân có tồn tại không
    const patient = await this.patientRepository.findPatientById(patientId);
    if (!patient) {
      throw new BaseError(404, "Bệnh nhân không tồn tại");
    }

    // Lấy tất cả bệnh án đầy đủ của bệnh nhân (dùng method mới)
    return await this.sharedRepository.getPatientMedicalRecords(
      patientId,
      clinicId,
      fromDate,
      toDate
    );
  }
}
