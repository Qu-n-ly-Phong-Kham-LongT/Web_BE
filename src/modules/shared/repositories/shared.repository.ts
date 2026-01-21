import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import { prisma } from "../../../config/database.config";
import { FullMedicalRecordDto } from "../dtos/medical-record-detail.dto";
import { MedicalRecordPrintDto } from "../dtos/medical-record.print";
import { mapToClinicalExaminationResponse } from "../../clinical-examination/dtos/clinical-examination.response.dto";
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
    doctor: true;
    clinic: true;
    prescription: {
      include: {
        details: {
          include: {
            medicine: true;
          };
        };
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

export class SharedRepository {
  public async getFullMedicalRecord(
    id: string,
  ): Promise<FullMedicalRecordDto | null> {
    const record = await prisma.medicalRecord.findUnique({
      where: { recordId: id },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        prescription: {
          include: {
            details: {
              include: {
                medicine: true,
              },
            },
          },
        },
        doctor: true,
        clinic: true,
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.mapRecordToFullDto(record);
  }

  public async getFullMedicalRecordsByPatientId(
    patientId: string,
    clinicId?: string,
    fromDate?: Date,
    toDate?: Date,
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
      orderBy: { createdAt: "desc" },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        doctor: true,
        clinic: true,
        prescription: {
          include: {
            details: {
              include: {
                medicine: true,
              },
            },
          },
        },
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
    toDate?: Date,
  ): Promise<FullMedicalRecordDto[]> {
    const where: Prisma.MedicalRecordWhereInput = {
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
      orderBy: { createdAt: "desc" },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        doctor: true,
        clinic: true,
        prescription: {
          include: {
            details: {
              include: {
                medicine: true,
              },
            },
          },
        },
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
    toDate?: Date,
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
      orderBy: { createdAt: "desc" },
      include: {
        patient: { include: { allergies: true } },
        clinicalExamination: true,
        doctor: true,
        clinic: true,
        prescription: {
          include: {
            details: {
              include: {
                medicine: true,
              },
            },
          },
        },
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

  private mapRecordToFullDto(
    record: MedicalRecordWithFullRelations,
  ): FullMedicalRecordDto {
    const patient = record.patient
      ? {
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
          createdAt: record.patient.createdAt
            ? record.patient.createdAt.toISOString()
            : "",
          updatedAt: record.patient.updatedAt
            ? record.patient.updatedAt.toISOString()
            : "",
          patientAllergies: (record.patient.allergies ?? []).flatMap((a) => {
            const data =
              (a.data as
                | { drug?: string | null; reaction?: string | null }
                | { drug?: string | null; reaction?: string | null }[]
                | null) || [];
            const items = Array.isArray(data) ? data : [data];
            return items.map((item) => ({
              drug: item?.drug ?? null,
              reaction: item?.reaction ?? null,
            }));
          }),
        }
      : null;

    const clinicalExamination =
      record.clinicalExamination && record.patient
        ? mapToClinicalExaminationResponse(
            record.clinicalExamination,
            record.patient.allergies?.[0] ?? null,
          )
        : null;

    const medicalRecord = {
      recordId: record.recordId,
      recordCode: record.recordCode ?? "",
      patientId: record.patientId ?? "",
      doctorId: record.doctorId ?? "",
      clinicId: record.clinicId ?? "",
      evidenceBasedDiagnosis: record.evidenceBasedDiagnosis ?? undefined,
      diagnoses: record.diagnoses
        ? (record.diagnoses as unknown as MedicalDiagnosisDto)
        : undefined,
      doctorAdvice: record.doctorAdvice ?? undefined,
      treatmentNote: record.treatmentNote ?? undefined,
      consultationFee: record.consultationFee
        ? Number(record.consultationFee)
        : 0,
      createdAt: record.createdAt ?? new Date(0),
      updatedAt: record.updatedAt ?? new Date(0),
    };

    const serviceRequest: ServiceRequestFullResponseDto[] =
      record.serviceRequests.map((request: ServiceRequestWithRelations) => {
        const resultsByDetailId = new Map<
          string,
          ServiceRequestResultResponseDto[]
        >();
        const resultsByItemId = new Map<
          string,
          ServiceRequestResultResponseDto[]
        >();

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
            executedAt: result.executedAt
              ? result.executedAt.toISOString()
              : null,
            updatedAt: result.updatedAt ? result.updatedAt.toISOString() : null,
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
              (serviceItem?.configs ?? []).map((cfg) => [cfg.configId, cfg]),
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

            const selectedOptions = detail.selectedOptions as
              | SelectedOptions
              | null
              | undefined;

            const selectedConfigs: ServiceRequestSelectedConfigResponseDto[] =
              selectedOptions?.selectedConfigs?.map((cfg: SelectedConfig) => {
                const meta = configMetaMap.get(cfg.configId);
                return {
                  configId: cfg.configId,
                  configCode: cfg.configCode ?? meta?.configCode ?? null,
                  displayName: meta?.displayName ?? null,
                  unit: meta?.unit ?? null,
                  selectedValues: cfg.selectedValues ?? [],
                  totalSurcharge:
                    cfg.totalSurcharge !== undefined &&
                    cfg.totalSurcharge !== null
                      ? Number(cfg.totalSurcharge)
                      : null,
                };
              }) ?? [];

            const detailResults =
              (detail.requestDetailId
                ? resultsByDetailId.get(detail.requestDetailId)
                : undefined) ??
              (detail.itemId
                ? resultsByItemId.get(detail.itemId)
                : undefined) ??
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
          diagnoses: request.diagnoses
            ? (request.diagnoses as unknown as MedicalDiagnosisDto)
            : null,
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
          note: record.prescription.note ?? "",
          totalPrice: record.prescription.totalPrice
            ? Number(record.prescription.totalPrice)
            : 0,
          status: record.prescription.status ?? "Issued",
          createdAt: record.prescription.createdAt ?? new Date(0),
          updateAt: record.prescription.updatedAt ?? new Date(0),
          printedAt: record.prescription.printedAt ?? null,
          printCount: record.prescription.printCount ?? 0,
          details: record.prescription.details.map((detail) => ({
            medicineId: detail.medicineId ?? "",
            medicineName: detail.medicine?.medicineName ?? "",
            sellPrice:
              detail.appliedExportPrice !== null &&
              detail.appliedExportPrice !== undefined
                ? Number(detail.appliedExportPrice)
                : detail.medicine?.sellPrice !== null &&
                    detail.medicine?.sellPrice !== undefined
                  ? Number(detail.medicine.sellPrice)
                  : null,
            frequencyPerDay: detail.frequencyPerDay ?? 0,
            quantityPerTime: detail.quantityPerTime
              ? Number(detail.quantityPerTime)
              : 0,
            quantity: detail.quantity ? Number(detail.quantity) : 0,
            unit: detail.unit ?? "",
            administrationRoute: detail.administrationRoute ?? undefined,
            timing: detail.timing ?? "",
            daysToTake: detail.daysToTake ?? 0,
            note: detail.note ?? null,
            isInsuranceCovered: detail.isInsuranceCovered ?? false,
          })),
        }
      : null;

    const followUp = record.followUp
      ? {
          appointmentDate: record.followUp.appointmentDate ?? null,
          session: record.followUp.session ?? null,
          reason: record.followUp.reason ?? null,
        }
      : null;

    return {
      patient,
      clinicalExamination,
      medicalRecord,
      serviceRequest,
      prescription,
      followUp,
      clinic: record.clinic
        ? {
            clinicId: record.clinic.clinicId,
            clinicName: record.clinic.clinicName ?? null,
            address: record.clinic.address ?? null,
            phones: record.clinic.phones ?? [],
          }
        : null,
      doctor: record.doctor
        ? {
            doctorId: record.doctor.userId,
            fullName: record.doctor.fullName ?? null,
          }
        : null,
    };
  }

  public buildMedicalRecordTemplateData(
    dto: FullMedicalRecordDto,
  ): MedicalRecordPrintDto {
    const formatDate = (value?: string | Date | null) => {
      if (!value) {
        return "";
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("vi-VN");
    };
    const formatDateLong = (value?: string | Date | null) => {
      if (!value) {
        return "";
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `Ngày ${day} tháng ${month} năm ${year}`;
    };
    const toStringValue = (value: unknown) =>
      value === null || value === undefined ? "" : String(value);
    const toBoolString = (value?: boolean | null) => {
      if (value === null || value === undefined) {
        return "";
      }
      return value ? "Có" : "Không";
    };

    const medicalRecord = dto.medicalRecord;
    const patient = dto.patient;
    const clinicalExamination = dto.clinicalExamination;
    const prescription = dto.prescription;
    const followUp = dto.followUp;

    const diagnoses = medicalRecord.diagnoses;
    const diagnosisLines: string[] = [];
    if (diagnoses?.main) {
      diagnosisLines.push(
        `${diagnoses.main.code} - ${diagnoses.main.description}`,
      );
    }
    if (diagnoses?.secondary?.length) {
      diagnosisLines.push(
        diagnoses.secondary
          .map((item) => `${item.code} - ${item.description}`)
          .join("; "),
      );
    }

    const prescriptionDetails = (prescription?.details ?? []).map((detail) => ({
      medicineId: toStringValue(detail.medicineId),
      medicineName: toStringValue(detail.medicineName),
      frequencyPerDay: toStringValue(detail.frequencyPerDay),
      quantityPerTime: toStringValue(detail.quantityPerTime),
      quantity: toStringValue(detail.quantity),
      unit: toStringValue(detail.unit),
      administrationRoute: toStringValue(detail.administrationRoute),
      timing: toStringValue(detail.timing),
      daysToTake: toStringValue(detail.daysToTake),
      note: toStringValue(detail.note),
      isInsuranceCovered: toBoolString(detail.isInsuranceCovered),
    }));

    const medicines = prescriptionDetails.map((detail, index) => {
      const usageParts: string[] = [];
      if (detail.frequencyPerDay) {
        usageParts.push(`Ngày uống: ${detail.frequencyPerDay} lần`);
      }
      if (detail.quantityPerTime) {
        usageParts.push(`Mỗi lần: ${detail.quantityPerTime} ${detail.unit}`);
      }
      if (detail.timing) {
        usageParts.push(`${detail.timing}`);
      }

      let prepNote = "";
      if (detail.note && detail.note.length > 0) {
        prepNote = toStringValue(", Ghi chú: " + detail.note);
      }
      return {
        index: index + 1,
        medicineId: detail.medicineId,
        medicineName: detail.medicineName,
        quantity: detail.quantity,
        unit: detail.unit,
        usage: usageParts.join(", "),
        prepNote,
      };
    });

    const serviceRequests = dto.serviceRequest.map((request) => ({
      requestId: toStringValue(request.requestId),
      requestCode: toStringValue(request.requestCode),
      recordId: toStringValue(request.recordId),
      recordCode: toStringValue(request.recordCode),
      orderingDoctorId: toStringValue(request.orderingDoctorId),
      diagnoses: request.diagnoses ?? "",
      isPatientRequested: toBoolString(request.isPatientRequested),
      receiveResultAtClinic: toBoolString(request.receiveResultAtClinic),
      isForFollowUp: toBoolString(request.isForFollowUp),
      note: toStringValue(request.note),
      createdAt: toStringValue(request.createdAt),
      patientId: toStringValue(request.patientId),
      details: request.details.map((detail) => ({
        requestId: toStringValue(request.requestId),
        requestDetailId: toStringValue(detail.requestDetailId),
        itemId: toStringValue(detail.itemId),
        itemCode: toStringValue(detail.itemCode),
        itemName: toStringValue(detail.itemName),
        selectedOptions: detail.selectedOptions ?? "",
        results: detail.results.map((result) => ({
          resultId: toStringValue(result.resultId),
          detailId: toStringValue(result.detailId),
          requestId: toStringValue(request.requestId),
          requestDetailId: toStringValue(detail.requestDetailId),
          itemId: toStringValue(detail.itemId),
          configId: toStringValue(result.configId),
          indicatorName: toStringValue(result.indicatorName),
          valueString: toStringValue(result.valueString),
          valueNumber: toStringValue(result.valueNumber),
          unit: toStringValue(result.unit),
          executedAt: toStringValue(result.executedAt),
        })),
      })),
    }));

    const serviceRequestSelectedConfigs = dto.serviceRequest.flatMap(
      (request) =>
        request.details.flatMap((detail) =>
          detail.selectedConfigs.map((config) => ({
            requestId: toStringValue(request.requestId),
            requestDetailId: toStringValue(detail.requestDetailId),
            itemId: toStringValue(detail.itemId),
            configId: toStringValue(config.configId),
            configCode: toStringValue(config.configCode),
            displayName: toStringValue(config.displayName),
            unit: toStringValue(config.unit),
            selectedValues: config.selectedValues ?? [],
            totalSurcharge: toStringValue(config.totalSurcharge),
          })),
        ),
    );

    const hasPregnancyStatus =
      !!clinicalExamination?.pregnancyStatus &&
      clinicalExamination.pregnancyStatus !== "None";
    const pregnancyWeeks = hasPregnancyStatus
      ? toStringValue(clinicalExamination?.pregnancyWeeks)
      : "";

    const clinicPhones =
      dto.clinic?.phones && dto.clinic.phones.length > 0
        ? dto.clinic.phones.join(" - ")
        : "";
    const doctorName = toStringValue(dto.doctor?.fullName);
    return {
      recordId: toStringValue(medicalRecord.recordId),
      recordCode: toStringValue(medicalRecord.recordCode),
      recordDate: formatDate(medicalRecord.createdAt),
      patientId: toStringValue(medicalRecord.patientId),
      doctorId: toStringValue(medicalRecord.doctorId),
      clinicId: toStringValue(medicalRecord.clinicId),
      clinicName: toStringValue(dto.clinic?.clinicName),
      clinicAddress: toStringValue(dto.clinic?.address),
      clinicPhones,
      doctorName,
      evidenceBasedDiagnosis: toBoolString(
        medicalRecord.evidenceBasedDiagnosis,
      ),
      diagnosisMainCode: toStringValue(diagnoses?.main?.code),
      diagnosisMainDescription: toStringValue(diagnoses?.main?.description),
      diagnosisMainNote: toStringValue(diagnoses?.main?.note),
      diagnosisSecondary: diagnoses?.secondary ?? [],
      diagnosisText: diagnosisLines.join("; "),
      doctorAdvice: toStringValue(medicalRecord.doctorAdvice),
      treatmentNote: toStringValue(medicalRecord.treatmentNote),
      consultationFee: toStringValue(medicalRecord.consultationFee),
      recordCreatedAt: formatDate(medicalRecord.createdAt),
      recordUpdatedAt: formatDate(medicalRecord.updatedAt),
      patientCode: toStringValue(patient?.patientCode),
      fullName: toStringValue(patient?.fullName),
      gender:
        patient?.gender === "Male"
          ? "Nam"
          : patient?.gender === "Female"
            ? "Nữ"
            : patient?.gender === "Other"
              ? "Khác"
              : "",
      dob: formatDate(patient?.dob ?? null),
      age: toStringValue(patient?.age),
      patientCategory: toStringValue(patient?.patientCategory),
      phone: toStringValue(patient?.phone),
      email: toStringValue(patient?.email),
      identityCard: toStringValue(patient?.identityCard),
      insuranceNumber: toStringValue(patient?.insuranceNumber),
      occupation: toStringValue(patient?.occupation),
      address: toStringValue(patient?.address),
      patientCreatedAt: formatDate(patient?.createdAt ?? null),
      patientUpdatedAt: formatDate(patient?.updatedAt ?? null),
      patientAllergies: (patient?.patientAllergies ?? []).map((item) => ({
        drug: toStringValue(item.drug),
        reaction: toStringValue(item.reaction),
      })),
      examId: toStringValue(clinicalExamination?.examId),
      examRecordId: toStringValue(clinicalExamination?.recordId),
      reasonForVisit: toStringValue(clinicalExamination?.reasonForVisit),
      medicalHistory: toStringValue(clinicalExamination?.medicalHistory),
      pastMedicalHistory: toStringValue(
        clinicalExamination?.pastMedicalHistory,
      ),
      clinicalExamination: toStringValue(
        clinicalExamination?.clinicalExamination,
      ),
      heartRate: toStringValue(clinicalExamination?.heartRate),
      pressure: toStringValue(clinicalExamination?.bloodPressure),
      temperature: toStringValue(clinicalExamination?.temperature),
      height: toStringValue(clinicalExamination?.height),
      weight: toStringValue(clinicalExamination?.weight),
      bmi: toStringValue(clinicalExamination?.bmi),
      pregnancyStatus: toStringValue(clinicalExamination?.pregnancyStatus),
      weeks: pregnancyWeeks,
      hasPoorAppetite: toBoolString(clinicalExamination?.hasPoorAppetite),
      hasWeightLoss: toBoolString(clinicalExamination?.hasWeightLoss),
      hasHealthInsurance: toBoolString(clinicalExamination?.hasHealthInsurance),
      isBreastfeeding: toBoolString(clinicalExamination?.isBreastfeeding),
      clinicalNotes: toStringValue(clinicalExamination?.clinicalNotes),
      examinedAt: formatDate(clinicalExamination?.examinedAt ?? null),
      examinedBy: toStringValue(clinicalExamination?.examinedBy),
      allergies: (clinicalExamination?.allergies ?? []).map((item) => ({
        drug: toStringValue(item.drug),
        reaction: toStringValue(item.reaction),
      })),
      prescriptionId: toStringValue(prescription?.prescriptionId),
      prescriptionNote: toStringValue(prescription?.note),
      totalPrice: toStringValue(prescription?.totalPrice),
      status: toStringValue(prescription?.status),
      prescriptionCreatedAt: formatDateLong(prescription?.createdAt ?? null),
      prescriptionUpdatedAt: formatDate(prescription?.updateAt ?? null),
      prescriptionDetails,
      medicines,
      requests: serviceRequests,
      requestSelectedConfigs: serviceRequestSelectedConfigs,
      appointmentDate: formatDate(followUp?.appointmentDate ?? null),
      appointmentSession: toStringValue(followUp?.session),
      appointmentReason: toStringValue(followUp?.reason),
    };
  }
}
