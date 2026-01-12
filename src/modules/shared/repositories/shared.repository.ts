import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import { prisma } from "../../../config/database.config";
import { FullMedicalRecordDto } from "../dtos/medical-record-detail.dto";
import {
  mapToClinicalExaminationResponse,
} from "../../clinical-examination/dtos/clinical-examination.response.dto";
import {
  ServiceRequestDetailFullResponseDto,
  ServiceRequestFullResponseDto,
  ServiceRequestResultResponseDto,
  ServiceRequestSelectedConfigResponseDto,
} from "../../service-request/dtos/service-request.response.dto";
import { calculateAge } from "../../../utils/date.util";
import { Prisma } from "@prisma/client";

type ServiceRequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: {
    details: {
      include: {
        serviceItem: {
          include: {
            configs: true;
          };
        };
      };
    };
    serviceResults: true;
  };
}>;

type ServiceRequestDetailWithRelations = Prisma.ServiceRequestDetailGetPayload<{
  include: {
    serviceItem: {
      include: {
        configs: true;
      };
    };
  };
}>;

type MedicalRecordWithFullRelations = Prisma.MedicalRecordGetPayload<{
  include: {
    patient: {
      include: {
        allergies: true;
      };
    };
    clinicalExamination: true;
    prescription: {
      include: {
        details: true;
      };
    };
    followUp: true;
    serviceRequests: {
      include: {
        details: {
          include: {
            serviceItem: {
              include: {
                configs: true;
              };
            };
          };
        };
        serviceResults: true;
      };
    };
  };
}>;

interface AllergyItem {
  drug?: string | null;
  reaction?: string | null;
}

export class SharedRepository {
  public async getFullMedicalRecord(
    id: string
  ): Promise<FullMedicalRecordDto | null> {
    const record = await prisma.medicalRecord.findUnique({
      where: { recordId: id },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        prescription: { include: { details: true } },
        followUp: true,
        serviceRequests: {
          include: {
            details: {
              include: {
                serviceItem: { include: { configs: true } },
              },
            },
            serviceResults: true,
          },
        },
      },
    });

    if (
      !record ||
      !record.patient ||
      !record.clinicalExamination ||
      !record.prescription ||
      !record.followUp
    ) {
      return null;
    }

    return this.mapRecordToFullDto(record);
  }

  private mapRecordToFullDto(record: MedicalRecordWithFullRelations): FullMedicalRecordDto {
    if (!record.patient) {
      throw new Error("Record must have patient");
    }

    const patient = {
      patientID: record.patient.patientId,
      patientCode: record.patient.patientCode ?? "",
      fullName: record.patient.fullName ?? "",
      gender: record.patient.gender,
      dob: record.patient.dob ? record.patient.dob.toISOString() : "",
      age: calculateAge(record.patient.dob),
      patientCategory: record.patient.patientCategory,
      phone: record.patient.phone ?? "",
      email: record.patient.email,
      identityCard: record.patient.identityCard,
      insuranceNumber: record.patient.insuranceNumber,
      occupation: record.patient.occupation,
      address: record.patient.address,
      createdAt: record.patient.createdAt ? record.patient.createdAt.toISOString() : "",
      updatedAt: record.patient.updatedAt ? record.patient.updatedAt.toISOString() : "",
      patientAllergies: (record.patient.allergies ?? []).flatMap((a) => {
        const data = (a.data as AllergyItem[] | AllergyItem | null) || [];
        const items = Array.isArray(data) ? data : [data];
        return items.map((item: AllergyItem) => ({
          drug: item?.drug ?? null,
          reaction: item?.reaction ?? null,
        }));
      }),
    };

    const clinicalExamination = record.clinicalExamination
      ? mapToClinicalExaminationResponse(
          record.clinicalExamination,
          record.patient.allergies?.[0] ?? null
        )
      : {
          examId: "",
          recordId: record.recordId ?? "",
          reasonForVisit: null,
          medicalHistory: null,
          pastMedicalHistory: null,
          clinicalExamination: null,
          heartRate: null,
          bloodPressure: null,
          temperature: null,
          height: null,
          weight: null,
          pregnancyStatus: null,
          pregnancyWeeks: null,
          clinicalNotes: null,
          examinedAt: null,
          examinedBy: null,
          allergies: [],
        };

    const medicalRecord = {
      recordId: record.recordId,
      recordCode: record.recordCode ?? "",
      patientId: record.patientId ?? "",
      doctorId: record.doctorId ?? "",
      clinicId: record.clinicId ?? "",
      evidenceBasedDiagnosis: record.evidenceBasedDiagnosis ?? undefined,
      diagnoses: record.diagnoses ? (record.diagnoses as unknown as MedicalDiagnosisDto) : undefined,
      doctorAdvice: record.doctorAdvice ?? undefined,
      treatmentNote: record.treatmentNote ?? undefined,
      consultationFee: record.consultationFee ? Number(record.consultationFee) : 0,
      createdAt: record.createdAt ?? new Date(0),
      updatedAt: record.updatedAt ?? new Date(0),
    };

    const serviceRequest: ServiceRequestFullResponseDto[] =
      record.serviceRequests.map((request: ServiceRequestWithRelations) => {
        const resultsByDetailId = new Map<string, ServiceRequestResultResponseDto[]>();
        const resultsByItemId = new Map<string, ServiceRequestResultResponseDto[]>();

        for (const result of request.serviceResults) {
          const resultDto: ServiceRequestResultResponseDto = {
            resultId: result.resultId,
            detailId: result.detailId ?? null,
            requestId: result.requestId ?? null,
            itemId: result.itemId ?? null,
            configId: result.configId ?? null,
            indicatorName: result.indicatorName ?? null,
            valueString: result.valueString ?? null,
            valueNumber:
              result.valueNumber !== null && result.valueNumber !== undefined
                ? Number(result.valueNumber)
                : null,
            unit: result.unit ?? null,
            images: result.images ?? null,
            executedAt: result.executedAt ? result.executedAt.toISOString() : null,
          };

          if (result.detailId) {
            const list = resultsByDetailId.get(result.detailId) ?? [];
            list.push(resultDto);
            resultsByDetailId.set(result.detailId, list);
          }

          if (result.itemId) {
            const list = resultsByItemId.get(result.itemId) ?? [];
            list.push(resultDto);
            resultsByItemId.set(result.itemId, list);
          }
        }

        const details: ServiceRequestDetailFullResponseDto[] =
          request.details.map((detail: ServiceRequestDetailWithRelations) => {
            const serviceItem = detail.serviceItem;
            const configMetaMap = new Map(
              (serviceItem?.configs ?? []).map((cfg) => [cfg.configId, cfg])
            );
            interface SelectedConfig {
              configId: string;
              configCode?: string | null;
              selectedValues?: string[];
              totalSurcharge?: number;
            }

            interface SelectedOptions {
              selectedConfigs?: SelectedConfig[];
            }

            const selectedOptions = detail.selectedOptions as SelectedOptions | null | undefined;

            const selectedConfigs: ServiceRequestSelectedConfigResponseDto[] =
              selectedOptions?.selectedConfigs?.map((cfg: SelectedConfig) => {
                const meta = configMetaMap.get(cfg.configId);
                return {
                  configId: cfg.configId,
                  configCode: cfg.configCode ?? (meta?.configCode ?? null),
                  displayName: meta?.displayName ?? null,
                  selectedValues: cfg.selectedValues ?? [],
                  totalSurcharge:
                    cfg.totalSurcharge !== undefined && cfg.totalSurcharge !== null
                      ? Number(cfg.totalSurcharge)
                      : null,
                };
              }) ?? [];

            const detailResults =
              (detail.requestDetailId
                ? resultsByDetailId.get(detail.requestDetailId)
                : undefined) ??
              (detail.itemId ? resultsByItemId.get(detail.itemId) : undefined) ??
              [];

            return {
              requestDetailId: detail.requestDetailId,
              itemId: detail.itemId ?? null,
              itemCode: serviceItem?.itemCode ?? null,
              itemName: serviceItem?.name ?? null,
              selectedOptions: detail.selectedOptions ?? null,
              selectedConfigs,
              results: detailResults,
            };
          });

        return {
          requestId: request.requestId,
          requestCode: request.requestCode ?? null,
          recordId: request.recordId ?? null,
          recordCode: record.recordCode ?? null,
          orderingDoctorId: request.orderingDoctorId ?? null,
          diagnoses: request.diagnoses ?? null,
          isPatientRequested: request.isPatientRequested ?? null,
          receiveResultAtClinic: request.receiveResultAtClinic ?? null,
          isForFollowUp: request.isForFollowUp ?? null,
          note: request.note ?? null,
          createdAt: request.createdAt ? request.createdAt.toISOString() : null,
          patientId: record.patientId ?? null,
          details,
        };
      });

    const prescription = record.prescription
      ? {
          prescriptionId: record.prescription.prescriptionId,
          pdfPath: record.prescription.pdfPath ?? "",
          fileName: record.prescription.fileName ?? "",
          note: record.prescription.note ?? "",
          totalPrice: record.prescription.totalPrice
            ? Number(record.prescription.totalPrice)
            : 0,
          status: record.prescription.status ?? "Issued",
          createdAt: record.prescription.createdAt ?? new Date(0),
          updateAt: record.prescription.updatedAt ?? new Date(0),
          details: (record.prescription.details ?? []).map((detail) => ({
            medicineId: detail.medicineId ?? "",
            frequencyPerDay: detail.frequencyPerDay ?? 0,
            quantityPerTime: detail.quantityPerTime ? Number(detail.quantityPerTime) : 0,
            quantity: detail.quantity ? Number(detail.quantity) : 0,
            unit: detail.unit ?? "",
            administrationRoute: detail.administrationRoute ?? undefined,
            timing: detail.timing ?? "",
            daysToTake: detail.daysToTake ?? 0,
            note: detail.note ?? null,
            isInsuranceCovered: detail.isInsuranceCovered ?? false,
          })),
        }
      : {
          prescriptionId: "",
          pdfPath: "",
          fileName: "",
          note: "",
          totalPrice: 0,
          status: "Issued" as const,
          createdAt: new Date(0),
          updateAt: new Date(0),
          details: [],
        };

    const followUp = record.followUp
      ? {
          appointmentDate: record.followUp.appointmentDate ?? null,
          session: record.followUp.session ?? null,
          reason: record.followUp.reason ?? null,
        }
      : {
          appointmentDate: null,
          session: null,
          reason: null,
        };

    return {
      patient,
      clinicalExamination,
      medicalRecord,
      serviceRequest,
      prescription,
      followUp,
    };
  }

  public async getFullMedicalRecordsByPatientId(
    patientId: string,
    clinicId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<FullMedicalRecordDto[]> {
    const where: any = {
      patientId,
      ...(clinicId ? { clinicId } : {}),
    };

    // Filter theo ngày nếu có
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      if (toDate) {
        // Set to end of day
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        prescription: { include: { details: true } },
        followUp: true,
        serviceRequests: {
          include: {
            details: {
              include: {
                serviceItem: { include: { configs: true } },
              },
            },
            serviceResults: true,
          },
        },
      },
    });

    return records
      .filter((record) => record.patient) // Chỉ lấy records có patient
      .map((record) => this.mapRecordToFullDto(record));
  }

  public async getFullMedicalRecordsByDoctorId(
    doctorId: string,
    clinicId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<FullMedicalRecordDto[]> {
    const where: any = {
      doctorId,
      ...(clinicId ? { clinicId } : {}),
    };

    // Filter theo ngày nếu có
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      if (toDate) {
        // Set to end of day
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        prescription: { include: { details: true } },
        followUp: true,
        serviceRequests: {
          include: {
            details: {
              include: {
                serviceItem: { include: { configs: true } },
              },
            },
            serviceResults: true,
          },
        },
      },
    });

    return records
      .filter((record) => record.patient) // Chỉ lấy records có patient
      .map((record) => this.mapRecordToFullDto(record));
  }

  public async getPatientMedicalRecords(
    patientId: string,
    clinicId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<FullMedicalRecordDto[]> {
    const where: Prisma.MedicalRecordWhereInput = {
      patientId,
      ...(clinicId ? { clinicId } : {}),
    };

    // Filter theo ngày nếu có
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      if (toDate) {
        // Set to end of day
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        prescription: { include: { details: true } },
        followUp: true,
        serviceRequests: {
          include: {
            details: {
              include: {
                serviceItem: { include: { configs: true } },
              },
            },
            serviceResults: true,
          },
        },
      },
    });

    return records
      .filter((record) => record.patient)
      .map((record) => this.mapRecordToFullDto(record));
  }
}
