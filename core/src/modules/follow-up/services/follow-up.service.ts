import { Prisma } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { createPagination } from "../../../utils/pagination.util";
import { GetFollowUpsQueryDto } from "../dtos/follow-up.request.dto";
import {
  FollowUpListItemResponseDto,
  FollowUpListResponseDto,
  FollowUpMedicalRecordResponseDto,
  FollowUpPatientResponseDto,
  FollowUpPrescriptionDetailResponseDto,
  FollowUpPrescriptionResponseDto,
  FollowUpServiceRequestDetailResponseDto,
  FollowUpServiceRequestResponseDto,
} from "../dtos/follow-up.response.dto";
import {
  FollowUpListRecord,
  FollowUpRepository,
} from "../repositories/follow-up.repository";

export class FollowUpService {
  private followUpRepository = new FollowUpRepository();

  public async getFollowUps(
    clinicId: string | null | undefined,
    query: GetFollowUpsQueryDto,
  ): Promise<FollowUpListResponseDto> {
    if (!clinicId) {
      throw new BaseError(403, "Không xác định được phòng khám");
    }

    if (query.startDate > query.endDate) {
      throw new BaseError(400, "endDate phải lớn hơn hoặc bằng startDate");
    }

    const { items, totalItems } =
      await this.followUpRepository.findByClinicAndDateRange({
        clinicId,
        startDate: query.startDate,
        endDate: query.endDate,
        page: query.page,
        limit: query.limit,
      });

    return {
      items: items.map((item) => this.mapToListItemResponse(item)),
      pagination: createPagination(query.page, query.limit, totalItems),
    };
  }

  private mapToListItemResponse(item: FollowUpListRecord): FollowUpListItemResponseDto {
    const medicalRecord: FollowUpMedicalRecordResponseDto | null = item.medicalRecord
      ? {
          recordId: item.medicalRecord.recordId,
          recordCode: item.medicalRecord.recordCode ?? null,
          diagnoses: item.medicalRecord.diagnoses ?? null,
          diagnosisNote: item.medicalRecord.diagnosisNote ?? null,
          patient: this.mapPatient(item),
          prescription: this.mapPrescription(item),
          serviceRequests: this.mapServiceRequests(item),
        }
      : null;

    return {
      followUpId: item.followUpId,
      appointmentDate: item.appointmentDate ? item.appointmentDate.toISOString() : null,
      session: item.session ?? null,
      reason: item.reason ?? null,
      medicalRecord,
    };
  }

  private mapPatient(item: FollowUpListRecord): FollowUpPatientResponseDto | null {
    const patient = item.medicalRecord?.patient;
    if (!patient) {
      return null;
    }

    return {
      patientId: patient.patientId,
      patientCode: patient.patientCode ?? null,
      fullName: patient.fullName ?? null,
      gender: patient.gender ?? null,
      dob: patient.dob ? patient.dob.toISOString() : null,
      phone: patient.phone ?? null,
      email: patient.email ?? null,
    };
  }

  private mapPrescription(
    item: FollowUpListRecord,
  ): FollowUpPrescriptionResponseDto | null {
    const prescription = item.medicalRecord?.prescription;
    if (!prescription) {
      return null;
    }

    const details: FollowUpPrescriptionDetailResponseDto[] =
      prescription.details.map((detail) => ({
        detailId: detail.detailId,
        unit: detail.unit ?? null,
        quantity: this.toNumber(detail.quantity),
        frequencyPerDay: detail.frequencyPerDay ?? null,
        quantityPerTime: this.toNumber(detail.quantityPerTime),
        daysToTake: detail.daysToTake ?? null,
        administrationRoute: detail.administrationRoute ?? null,
        timing: detail.timing ?? null,
        note: detail.note ?? null,
        medicine: detail.medicine
          ? {
              medicineId: detail.medicine.medicineId,
              medicineName: detail.medicine.medicineName ?? null,
              activeIngredient: detail.medicine.activeIngredient ?? null,
            }
          : null,
      }));

    return {
      prescriptionId: prescription.prescriptionId,
      prescriptionCode: prescription.prescriptionCode ?? null,
      status: prescription.status ? String(prescription.status) : null,
      totalPrice: this.toNumber(prescription.totalPrice),
      isDispensed: prescription.isDispensed ?? null,
      details,
    };
  }

  private mapServiceRequests(item: FollowUpListRecord): FollowUpServiceRequestResponseDto[] {
    const requests = item.medicalRecord?.serviceRequests ?? [];
    return requests.map((request) => {
      const details: FollowUpServiceRequestDetailResponseDto[] =
        request.details.map((detail) => ({
          requestDetailId: detail.requestDetailId,
          selectedOptions: detail.selectedOptions,
          serviceItem: detail.serviceItem
            ? {
                itemId: detail.serviceItem.itemId,
                itemCode: detail.serviceItem.itemCode ?? null,
                name: detail.serviceItem.name ?? null,
                basePrice: this.toNumber(detail.serviceItem.basePrice),
                unit: detail.serviceItem.unit ?? null,
                specimen: detail.serviceItem.specimen ?? null,
              }
            : null,
        }));

      return {
        requestId: request.requestId,
        requestCode: request.requestCode ?? null,
        diagnoses: request.diagnoses ?? null,
        diagnosisNote: request.diagnosisNote ?? null,
        isFollowUpTransferred: request.isFollowUpTransferred,
        followUpDate: request.followUpDate ? request.followUpDate.toISOString() : null,
        followUpSession: request.followUpSession ?? null,
        note: request.note ?? null,
        details,
      };
    });
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }
}
