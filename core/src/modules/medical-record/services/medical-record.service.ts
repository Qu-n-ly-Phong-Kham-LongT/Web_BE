import { MedicalRecordRepository } from "../repositories/medical-record.repository";
import {
  BasicMedicalRecordRequestDto,
  BasicMedicalRecordWithDateDto,
} from "../dtos/medical-record.request.dto";
import { MedicalRecord, Prisma } from "@prisma/client";
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
import { LegacyMedicalRecordImportRequestDto } from "../dtos/legacy-medical-record.request.dto";
import { ServiceItemRepository } from "../../service-item/repositories/service-item.request.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { prisma } from "../../../config/database.config";

export class MedicalRecordService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private userRepository = new UserRepository();
  private clinicRepository = new ClinicRepository();
  private patientRepository = new PatientRepository();
  private clinicalExaminationRepository = new ClinicalExaminationRepository();
  private sharedRepository = new SharedRepository();
  private serviceRequestRepository = new ServiceRequestRepository();
  private serviceItemRepository = new ServiceItemRepository();
  private medicineRepository = new MedicineRepository();

  public async createBasicMedicalRecord(
    createData: BasicMedicalRecordRequestDto,
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
      this.clinicRepository.findClinicById(createData.clinicId ?? ""),
    ]);
    if (!doctor) throw new BaseError(404, "Không tìm thấy bác sĩ.");
    if (!patient) throw new BaseError(404, "Bệnh nhân không tồn tại");
    if (!clinic) throw new BaseError(404, "Phòng khám không tồn tại");

    if (doctor.clinicId !== createData.clinicId) {
      throw new BaseError(
        403,
        "Bác sĩ không có quyền tạo bệnh án của phòng khám khác.",
      );
    }

    const { startUtc, endUtc } = getUtcDayRangeForTimeZone(
      new Date(),
      "Asia/Ho_Chi_Minh",
    );

    const record = await this.medicalRecordRepository.createRecord({
      patientId: createData.patientId,
      doctorId: createData.doctorId,
      clinicId: createData.clinicId,
      consultationFee: createData.consultationFee ?? 0,
    });

    let examinationId: string;
    const existingExam =
      await this.clinicalExaminationRepository.findByRecordId(record.recordId);
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

    const storedAllergies =
      await this.patientRepository.findAllergiesByPatientId(
        createData.patientId || "",
      );
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
    toDate?: Date,
  ): Promise<FullMedicalRecordDto[]> {
    const patient = await this.patientRepository.findPatientById(patientId);
    if (!patient) {
      throw new BaseError(404, "Bệnh nhân không tồn tại");
    }

    return await this.sharedRepository.getPatientMedicalRecords(
      patientId,
      clinicId,
      fromDate,
      toDate,
    );
  }

  public async importLegacyMedicalRecord(
    payload: LegacyMedicalRecordImportRequestDto,
    doctorId: string,
    clinicId: string,
  ): Promise<{
    recordId: string;
    examId?: string;
    serviceRequestIds: string[];
    prescriptionId?: string;
    fullRecord: FullMedicalRecordDto;
  }> {
    const [doctor, patient, clinic] = await Promise.all([
      this.userRepository.findUserById(doctorId || ""),
      this.patientRepository.findPatientById(payload.patientId || ""),
      this.clinicRepository.findClinicById(clinicId ?? ""),
    ]);
    if (!doctor) throw new BaseError(404, "Không tìm thấy bác sĩ.");
    if (!patient) throw new BaseError(404, "Bệnh nhân không tồn tại");
    if (!clinic) throw new BaseError(404, "Phòng khám không tồn tại");
    if (doctor.clinicId !== clinicId) {
      throw new BaseError(
        403,
        "Bác sĩ không có quyền tạo bệnh án của phòng khám khác.",
      );
    }

    const recordCreatedAt = this.parseDateOrThrow(
      payload.createdAt,
      "Ngày tạo bệnh án không hợp lệ",
    );
    const recordUpdatedAt = this.parseDateOrThrow(
      payload.updatedAt,
      "Ngày cập nhật bệnh án không hợp lệ",
    );

    const { startUtc, endUtc } = getUtcDayRangeForTimeZone(
      recordCreatedAt,
      "Asia/Ho_Chi_Minh",
    );

    const result = await prisma.$transaction(async (tx) => {
      const existingRecord = await tx.medicalRecord.findUnique({
        where: { recordId: payload.recordId },
      });

      if (existingRecord) {
        if (existingRecord.clinicId && existingRecord.clinicId !== clinicId) {
          throw new BaseError(403, "Bệnh án không thuộc phòng khám");
        }
        if (
          existingRecord.patientId &&
          existingRecord.patientId !== payload.patientId
        ) {
          throw new BaseError(400, "recordId không khớp với bệnh nhân");
        }
      } else {
        const existingByDate =
          await this.medicalRecordRepository.findExistingRecord(
            payload.patientId || "",
            clinicId ?? "",
            startUtc,
            endUtc,
          );
        if (existingByDate) {
          throw new BaseError(
            409,
            "Ngày hôm nay đã có bệnh án, hãy kiểm tra lại",
          );
        }
      }

      const record = existingRecord
        ? await tx.medicalRecord.update({
            where: { recordId: payload.recordId },
            data: {
              patientId: payload.patientId,
              doctorId: doctorId,
              clinicId: clinicId,
              consultationFee: payload.consultationFee ?? 0,
              evidenceBasedDiagnosis: payload.evidenceBasedDiagnosis ?? false,
              diagnoses: payload.diagnoses
                ? (payload.diagnoses as unknown as Prisma.InputJsonValue)
                : undefined,
              doctorAdvice: payload.doctorAdvice ?? null,
              treatmentNote: payload.treatmentNote ?? null,
            },
          })
        : await tx.medicalRecord.create({
            data: {
              recordId: payload.recordId,
              patientId: payload.patientId,
              doctorId: doctorId,
              clinicId: clinicId,
              consultationFee: payload.consultationFee ?? 0,
              evidenceBasedDiagnosis: payload.evidenceBasedDiagnosis ?? false,
              diagnoses: payload.diagnoses
                ? (payload.diagnoses as unknown as Prisma.InputJsonValue)
                : undefined,
              doctorAdvice: payload.doctorAdvice ?? null,
              treatmentNote: payload.treatmentNote ?? null,
              createdAt: recordCreatedAt,
              updatedAt: recordUpdatedAt,
            },
          });

      if (existingRecord) {
        await tx.$executeRaw`UPDATE "MedicalRecord" SET "createdAt" = ${recordCreatedAt}, "updatedAt" = ${recordUpdatedAt} WHERE "recordId" = ${record.recordId}`;
      }
      let examId: string | undefined;
      if (payload.clinicalExamination) {
        const examCreatedAt = this.parseDateOrThrow(
          payload.clinicalExamination.examinedAt,
          "Ngày khám lâm sàng không hợp lệ",
        );
        const examUpdatedAt = this.parseDateOrThrow(
          payload.clinicalExamination.updatedAt,
          "Ngày cập nhật khám lâm sàng không hợp lệ",
        );
        const existingExam = await tx.clinicalExamination.findUnique({
          where: { recordId: record.recordId },
        });
        const exam = existingExam
          ? await tx.clinicalExamination.update({
              where: { recordId: record.recordId },
              data: {
                examinedBy: doctorId,
                userId: doctorId,
                reasonForVisit:
                  payload.clinicalExamination.reasonForVisit ?? null,
                medicalHistory:
                  payload.clinicalExamination.medicalHistory ?? null,
                pastMedicalHistory:
                  payload.clinicalExamination.pastMedicalHistory ?? null,
                clinicalExamination:
                  payload.clinicalExamination.clinicalExamination ?? null,
                heartRate: payload.clinicalExamination.heartRate ?? null,
                bloodPressure:
                  payload.clinicalExamination.bloodPressure ?? null,
                temperature: payload.clinicalExamination.temperature ?? null,
                height: payload.clinicalExamination.height ?? null,
                weight: payload.clinicalExamination.weight ?? null,
                bmi: payload.clinicalExamination.bmi ?? null,
                hasHealthInsurance:
                  payload.clinicalExamination.hasHealthInsurance ?? false,
                isBreastfeeding:
                  payload.clinicalExamination.isBreastfeeding ?? false,
                pregnancyStatus:
                  payload.clinicalExamination.pregnancyStatus ?? null,
                pregnancyWeeks:
                  payload.clinicalExamination.pregnancyWeeks ?? null,
                hasPoorAppetite:
                  payload.clinicalExamination.hasPoorAppetite ?? false,
                hasWeightLoss:
                  payload.clinicalExamination.hasWeightLoss ?? false,
                clinicalNotes:
                  payload.clinicalExamination.clinicalNotes ?? null,
                examinedAt: examCreatedAt,
              },
            })
          : await tx.clinicalExamination.create({
              data: {
                recordId: record.recordId,
                examinedBy: doctorId,
                userId: doctorId,
                reasonForVisit:
                  payload.clinicalExamination.reasonForVisit ?? null,
                medicalHistory:
                  payload.clinicalExamination.medicalHistory ?? null,
                pastMedicalHistory:
                  payload.clinicalExamination.pastMedicalHistory ?? null,
                clinicalExamination:
                  payload.clinicalExamination.clinicalExamination ?? null,
                heartRate: payload.clinicalExamination.heartRate ?? null,
                bloodPressure:
                  payload.clinicalExamination.bloodPressure ?? null,
                temperature: payload.clinicalExamination.temperature ?? null,
                height: payload.clinicalExamination.height ?? null,
                weight: payload.clinicalExamination.weight ?? null,
                bmi: payload.clinicalExamination.bmi ?? null,
                hasHealthInsurance:
                  payload.clinicalExamination.hasHealthInsurance ?? false,
                isBreastfeeding:
                  payload.clinicalExamination.isBreastfeeding ?? false,
                pregnancyStatus:
                  payload.clinicalExamination.pregnancyStatus ?? null,
                pregnancyWeeks:
                  payload.clinicalExamination.pregnancyWeeks ?? null,
                hasPoorAppetite:
                  payload.clinicalExamination.hasPoorAppetite ?? false,
                hasWeightLoss:
                  payload.clinicalExamination.hasWeightLoss ?? false,
                clinicalNotes:
                  payload.clinicalExamination.clinicalNotes ?? null,
                examinedAt: examCreatedAt,
                updatedAt: examUpdatedAt,
              },
            });
        if (existingExam) {
          await tx.$executeRaw`UPDATE "ClinicalExamination" SET "updatedAt" = ${examUpdatedAt}, "examinedAt" = ${examCreatedAt} WHERE "recordId" = ${record.recordId}`;
        }
        examId = exam.examId;

        if (payload.clinicalExamination.allergies?.length) {
          await this.patientRepository.upsertAllergies(
            record.patientId ?? "",
            payload.clinicalExamination.allergies,
            tx,
          );
        }
      }

      const serviceRequestIds: string[] = [];
      if (payload.serviceRequests && payload.serviceRequests.length > 0) {
        for (const request of payload.serviceRequests) {
          if (!request.details || request.details.length === 0) {
            throw new BaseError(
              400,
              "Phiếu chỉ định phải có ít nhất 1 dịch vụ cận lâm sàng",
            );
          }

          const orderingDoctorId = request.orderingDoctorId ?? doctorId;
          const orderingDoctor = await this.userRepository.findUserById(
            orderingDoctorId,
            undefined,
            tx,
          );
          if (!orderingDoctor) {
            throw new BaseError(404, "Không tìm thấy bác sĩ chỉ định");
          }
          if (orderingDoctor.clinicId && orderingDoctor.clinicId !== clinicId) {
            throw new BaseError(403, "Bác sĩ không thuộc phòng khám hiện tại");
          }

          const itemIds = request.details.map((detail) => detail.itemId);
          const uniqueItemIds = [...new Set(itemIds)];
          if (uniqueItemIds.length !== itemIds.length) {
            throw new BaseError(
              400,
              "Không được chọn trùng lặp dịch vụ trong cùng một phiếu",
            );
          }

          const items =
            await this.serviceItemRepository.findActiveItemsWithConfigsByIds(
              uniqueItemIds,
              tx,
            );
          if (items.length !== uniqueItemIds.length) {
            throw new BaseError(
              400,
              "Một hoặc nhiều dịch vụ không tồn tại hoặc đang ngừng hoạt động",
            );
          }

          const itemConfigMap = new Map<
            string,
            {
              basePrice: number;
              configs: Map<
                string,
                { configCode: string | null; options: Map<string, number> }
              >;
            }
          >();
          for (const item of items) {
            const configMetaMap = new Map<
              string,
              { configCode: string | null; options: Map<string, number> }
            >();
            for (const config of item.configs) {
              const optionsMap = new Map<string, number>();
              const metaOptions = Array.isArray(
                (config.metaData as { options?: unknown })?.options,
              )
                ? ((
                    config.metaData as {
                      options?: { value?: string; surcharge?: number }[];
                    }
                  ).options ?? [])
                : [];
              for (const option of metaOptions) {
                if (typeof option?.value !== "string") {
                  continue;
                }
                const surcharge = Number(option?.surcharge ?? 0);
                if (!Number.isFinite(surcharge)) {
                  continue;
                }
                optionsMap.set(option.value, surcharge);
              }
              configMetaMap.set(config.configId, {
                configCode: config.configCode ?? null,
                options: optionsMap,
              });
            }
            const basePrice = item.basePrice
              ? Number(item.basePrice.toString())
              : 0;
            itemConfigMap.set(item.itemId, {
              basePrice,
              configs: configMetaMap,
            });
          }

          const detailsToCreate: {
            itemId: string;
            selectedOptions: Prisma.InputJsonValue;
          }[] = [];

          for (const detail of request.details) {
            const itemMeta = itemConfigMap.get(detail.itemId);
            if (!itemMeta) {
              throw new BaseError(
                400,
                "Dịch vụ không hợp lệ cho phiếu chỉ định",
              );
            }

            const selectedConfigs = detail.selectedConfigs ?? [];
            const configIds = selectedConfigs.map((cfg) => cfg.configId);
            const uniqueConfigIds = [...new Set(configIds)];
            if (uniqueConfigIds.length !== configIds.length) {
              throw new BaseError(
                400,
                "Không được chọn trùng lặp cấu hình cận lâm sàng",
              );
            }

            const normalizedSelectedConfigs: {
              configId: string;
              configCode: string | null;
              selectedValues: string[];
              totalSurcharge: number;
            }[] = [];
            let totalSurcharge = 0;

            for (const config of selectedConfigs) {
              const configMeta = itemMeta.configs.get(config.configId);
              if (!configMeta) {
                throw new BaseError(
                  400,
                  "Cấu hình không thuộc dịch vụ đã chọn",
                );
              }

              let configSurcharge = 0;
              if (configMeta.options.size > 0) {
                if (
                  !config.selectedValues ||
                  config.selectedValues.length === 0
                ) {
                  throw new BaseError(
                    400,
                    "Giá trị chọn của cấu hình không hợp lệ",
                  );
                }
                for (const selectedValue of config.selectedValues) {
                  const optionSurcharge = configMeta.options.get(selectedValue);
                  if (optionSurcharge === undefined) {
                    throw new BaseError(
                      400,
                      "Giá trị chọn không thuộc cấu hình",
                    );
                  }
                  configSurcharge += optionSurcharge;
                }
              }

              totalSurcharge += configSurcharge;
              normalizedSelectedConfigs.push({
                configId: config.configId,
                configCode: configMeta.configCode ?? null,
                selectedValues: config.selectedValues ?? [],
                totalSurcharge: configSurcharge,
              });
            }
            const basePrice = itemMeta.basePrice;
            const totalCharge = basePrice + totalSurcharge;
            detailsToCreate.push({
              itemId: detail.itemId,
              selectedOptions: {
                basePrice,
                totalSurcharge,
                totalCharge,
                selectedConfigs: normalizedSelectedConfigs,
              },
            });
          }

          const requestCreatedAt = this.parseDateOrThrow(
            request.createdAt,
            "Ngày tạo phiếu chỉ định không hợp lệ",
          );
          const requestUpdatedAt = this.parseDateOrThrow(
            request.updatedAt,
            "Ngày cập nhật phiếu chỉ định không hợp lệ",
          );
          const existingRequest = await tx.serviceRequest.findUnique({
            where: { requestId: request.requestId },
          });
          if (
            existingRequest &&
            existingRequest.recordId &&
            existingRequest.recordId !== record.recordId
          ) {
            throw new BaseError(400, "requestId không thuộc bệnh án này");
          }

          const createdRequest = existingRequest
            ? await tx.serviceRequest.update({
                where: { requestId: request.requestId },
                data: {
                  recordId: record.recordId,
                  orderingDoctorId: orderingDoctorId,
                  diagnoses: request.diagnoses
                    ? (request.diagnoses as unknown as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                  isPatientRequested: request.isPatientRequested ?? false,
                  receiveResultAtClinic: request.receiveResultAtClinic ?? false,
                  isForFollowUp: request.isForFollowUp ?? false,
                  isFollowUpTransferred: false,
                  isPrinted: request.isPrinted ?? false,
                  followUpDate: request.followUpDate
                    ? new Date(request.followUpDate)
                    : null,
                  followUpSession: request.followUpSession ?? null,
                  note: request.note ?? null,
                },
              })
            : await tx.serviceRequest.create({
                data: {
                  requestId: request.requestId,
                  recordId: record.recordId,
                  orderingDoctorId: orderingDoctorId,
                  diagnoses: request.diagnoses
                    ? (request.diagnoses as unknown as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                  isPatientRequested: request.isPatientRequested ?? false,
                  receiveResultAtClinic: request.receiveResultAtClinic ?? false,
                  isForFollowUp: request.isForFollowUp ?? false,
                  isFollowUpTransferred: false,
                  isPrinted: request.isPrinted ?? false,
                  followUpDate: request.followUpDate
                    ? new Date(request.followUpDate)
                    : null,
                  followUpSession: request.followUpSession ?? null,
                  note: request.note ?? null,
                  createdAt: requestCreatedAt,
                  updatedAt: requestUpdatedAt,
                },
              });

          if (existingRequest) {
            await tx.$executeRaw`UPDATE "ServiceRequest" SET "createdAt" = ${requestCreatedAt}, "updatedAt" = ${requestUpdatedAt} WHERE "requestId" = ${createdRequest.requestId}`;
            await tx.serviceResult.deleteMany({
              where: { requestId: createdRequest.requestId },
            });
            await tx.serviceRequestDetail.deleteMany({
              where: { requestId: createdRequest.requestId },
            });
          }

          await tx.serviceRequestDetail.createMany({
            data: detailsToCreate.map((detail) => ({
              requestId: createdRequest.requestId,
              itemId: detail.itemId,
              selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
            })),
          });
          if (request.details.some((d) => d.results && d.results.length > 0)) {
            const detailRows = await tx.serviceRequestDetail.findMany({
              where: { requestId: createdRequest.requestId },
              include: { serviceItem: { include: { configs: true } } },
            });

            const detailByItemId = new Map(
              detailRows
                .filter((d) => d.itemId)
                .map((d) => [d.itemId as string, d]),
            );

            const resultsToCreate: Prisma.ServiceResultUncheckedCreateInput[] =
              [];
            for (const detail of request.details) {
              const detailRow = detailByItemId.get(detail.itemId);
              if (!detailRow || !detailRow.serviceItem) {
                throw new BaseError(
                  400,
                  "Dịch vụ không hợp lệ để nhập kết quả",
                );
              }
              const configMap = new Map(
                detailRow.serviceItem.configs.map((cfg) => [cfg.configId, cfg]),
              );

              const results = detail.results ?? [];
              const configIds = results.map((r) => r.configId);
              const uniqueConfigIds = [...new Set(configIds)];
              if (uniqueConfigIds.length !== configIds.length) {
                throw new BaseError(400, "Không được trùng cấu hình kết quả");
              }

              for (const result of results) {
                const config = configMap.get(result.configId);
                if (!config) {
                  throw new BaseError(400, "Cấu hình không thuộc dịch vụ");
                }

                const resultUpdatedAt = this.parseDateOrThrow(
                  result.updatedAt,
                  "Ngày cập nhật kết quả không hợp lệ",
                );
                const executedAt = result.executedAt
                  ? this.parseDateOrThrow(
                      result.executedAt,
                      "Ngày thực hiện kết quả không hợp lệ",
                    )
                  : null;

                resultsToCreate.push({
                  detailId: detailRow.requestDetailId,
                  requestId: createdRequest.requestId,
                  itemId: detailRow.itemId ?? null,
                  configId: result.configId,
                  indicatorName:
                    result.indicatorName ??
                    config.displayName ??
                    config.configCode ??
                    null,
                  valueString: result.valueString ?? null,
                  valueNumber:
                    result.valueNumber !== undefined
                      ? result.valueNumber
                      : null,
                  unit: result.unit ?? config.unit ?? null,
                  executedAt: executedAt ?? undefined,
                  updatedAt: resultUpdatedAt,
                });
              }
            }

            if (resultsToCreate.length > 0) {
              await tx.serviceResult.createMany({ data: resultsToCreate });
            }
          }

          serviceRequestIds.push(createdRequest.requestId);
        }
      }

      let prescriptionId: string | undefined;
      if (payload.prescription) {
        const items = payload.prescription.prescriptionItems ?? [];
        const medicineIds = items.map((i) => i.medicineId);
        const uniqueMedicineIds = [...new Set(medicineIds)];

        if (uniqueMedicineIds.length !== medicineIds.length) {
          throw new BaseError(400, "Không được trùng thuốc trong cùng một toa");
        }

        const medicines =
          uniqueMedicineIds.length > 0
            ? await this.medicineRepository.findMedicinesByIds(
                uniqueMedicineIds,
                tx,
              )
            : [];

        if (medicines.length !== uniqueMedicineIds.length) {
          const found = new Set(medicines.map((m) => m.medicineId));
          const missing = uniqueMedicineIds.filter((id) => !found.has(id));
          throw new BaseError(
            400,
            `Thuốc không tồn tại: ${missing.join(", ")}`,
          );
        }

        const medicineMap = new Map(medicines.map((m) => [m.medicineId, m]));
        const detailsToCreate: Prisma.PrescriptionDetailUncheckedCreateInput[] =
          [];
        let totalPrice = 0;

        for (const item of items) {
          const medicine = medicineMap.get(item.medicineId);
          if (!medicine) {
            throw new BaseError(400, "Thuốc không hợp lệ");
          }

          const quantity = Number(item.quantity);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new BaseError(400, "Số lượng thuốc không hợp lệ");
          }

          let appliedPrice = medicine.sellPrice
            ? Number(medicine.sellPrice)
            : 0;
          if (item.isInsuranceCovered) {
            if (!medicine.isInsuranceCovered) {
              throw new BaseError(400, "Thuốc này không được BHYT hỗ trợ");
            }
            if (!medicine.insurancePrice) {
              throw new BaseError(400, "Thuốc này chưa có giá BHYT");
            }
            appliedPrice = Number(medicine.insurancePrice);
          }
          const lineTotal = appliedPrice * quantity;
          totalPrice += lineTotal;

          detailsToCreate.push({
            prescriptionId: "",
            medicineId: item.medicineId,
            unit: item.unit,
            frequencyPerDay: item.frequencyPerDay,
            quantityPerTime: item.quantityPerTime,
            administrationRoute: item.administrationRoute ?? null,
            timing: item.timing,
            quantity: quantity,
            daysToTake: item.daysToTake,
            isInsuranceCovered: item.isInsuranceCovered ?? false,
            appliedExportPrice: new Prisma.Decimal(appliedPrice),
            totalPrice: new Prisma.Decimal(lineTotal),
            note: item.note ?? null,
          });
        }

        const prescriptionNote =
          payload.treatmentNote ?? payload.doctorAdvice ?? null;
        const prescriptionCreatedAt = this.parseDateOrThrow(
          payload.prescription.createdAt,
          "Ngày tạo toa thuốc không hợp lệ",
        );
        const prescriptionUpdatedAt = this.parseDateOrThrow(
          payload.prescription.updatedAt,
          "Ngày cập nhật toa thuốc không hợp lệ",
        );
        const existingPrescription = await tx.prescription.findUnique({
          where: { recordId: record.recordId },
        });

        const prescription = existingPrescription
          ? await tx.prescription.update({
              where: { recordId: record.recordId },
              data: {
                totalPrice: new Prisma.Decimal(totalPrice),
                note: prescriptionNote,
              },
            })
          : await tx.prescription.create({
              data: {
                recordId: record.recordId,
                totalPrice: new Prisma.Decimal(totalPrice),
                note: prescriptionNote,
                createdAt: prescriptionCreatedAt,
                updatedAt: prescriptionUpdatedAt,
              },
            });
        prescriptionId = prescription.prescriptionId;

        if (existingPrescription) {
          await tx.$executeRaw`UPDATE "Prescription" SET "createdAt" = ${prescriptionCreatedAt}, "updatedAt" = ${prescriptionUpdatedAt} WHERE "prescriptionId" = ${prescription.prescriptionId}`;
          await tx.prescriptionDetail.deleteMany({
            where: { prescriptionId: prescription.prescriptionId },
          });
        }
        if (detailsToCreate.length > 0) {
          await tx.prescriptionDetail.createMany({
            data: detailsToCreate.map((detail) => ({
              ...detail,
              prescriptionId: prescription.prescriptionId,
            })),
          });
        }
      }

      if (payload.followUp) {
        let appointmentDate: Date | null = null;
        if (payload.followUp.appointmentDate) {
          appointmentDate = this.parseDateOrThrow(
            payload.followUp.appointmentDate,
            "Ngày hẹn không hợp lệ",
          );
        }

        await tx.followUp.upsert({
          where: { recordId: record.recordId },
          update: {
            appointmentDate,
            session: payload.followUp.session,
            reason: payload.followUp.reason ?? null,
          },
          create: {
            recordId: record.recordId,
            appointmentDate,
            session: payload.followUp.session,
            reason: payload.followUp.reason ?? null,
          },
        });
      }

      return {
        recordId: record.recordId,
        examId,
        serviceRequestIds,
        prescriptionId,
      };
    });

    const fullRecord = await this.sharedRepository.getFullMedicalRecord(
      result.recordId,
    );
    if (!fullRecord) {
      throw new BaseError(400, "Khong tim thay benh an sau khi nhap");
    }
    if (
      fullRecord.medicalRecord.clinicId &&
      fullRecord.medicalRecord.clinicId !== clinicId
    ) {
      throw new BaseError(403, "Benh an khong thuoc phong kham");
    }

    return {
      ...result,
      fullRecord,
    };
  }

  private parseDateOrThrow(value: unknown, message: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!date || Number.isNaN(date.getTime())) {
      throw new BaseError(400, message);
    }
    return date;
  }

  public async createBasicMedicalRecordWithDate(
    createData: BasicMedicalRecordRequestDto & {
      createdAt: Date | string;
      updatedAt?: Date | string;
    },
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
      this.clinicRepository.findClinicById(createData.clinicId || ""),
    ]);

    if (!doctor) throw new BaseError(404, "Không tìm thấy bác sĩ");
    if (!patient) throw new BaseError(404, "Không tìm thấy bệnh nhân");
    if (!clinic) throw new BaseError(404, "Không tìm thấy phòng khám");

    if (doctor.clinicId !== createData.clinicId) {
      throw new BaseError(403, "Không có quyền truy cập phòng khám khác");
    }

    const createdAt = new Date(createData.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new BaseError(400, "createdAt khong hop le");
    }
    const updatedAt = createData.updatedAt
      ? new Date(createData.updatedAt)
      : createdAt;
    if (Number.isNaN(updatedAt.getTime())) {
      throw new BaseError(400, "updatedAt khong hop le");
    }

    const { startUtc, endUtc } = getUtcDayRangeForTimeZone(
      createdAt,
      "Asia/Ho_Chi_Minh",
    );

    const existingRecord =
      await this.medicalRecordRepository.findExistingRecord(
        createData.patientId || "",
        createData.clinicId ?? "",
        startUtc,
        endUtc,
      );

    if (existingRecord) {
      throw new BaseError(
        409,
        "Bệnh nhân đã có bệnh án trong ngày, hãy kiểm tra lại",
      );
    }

    const record = await this.medicalRecordRepository.createRecord({
      patientId: createData.patientId,
      doctorId: createData.doctorId,
      clinicId: createData.clinicId,
      consultationFee: createData.consultationFee ?? 0,
      createdAt,
      updatedAt,
    });

    await prisma.$executeRaw`UPDATE "MedicalRecord" SET "createdAt" = ${createdAt}, "updatedAt" = ${updatedAt} WHERE "recordId" = ${record.recordId}`;
    let examinationId: string;
    const existingExam =
      await this.clinicalExaminationRepository.findByRecordId(record.recordId);
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

    const storedAllergies =
      await this.patientRepository.findAllergiesByPatientId(
        createData.patientId || "",
      );
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

  public async delete(recordId: string, clinicId?: string) {
    const record = await this.medicalRecordRepository.findById(recordId);
    if (!record) {
      throw new BaseError(404, "Không tìm thấy bệnh án");
    }

    if (clinicId && clinicId !== record.clinicId) {
      throw new BaseError(403, "Bệnh án không thuộc phòng khám");
    }

    return await this.medicalRecordRepository.delete(recordId);
  }
}
