import { BaseError } from "../../../utils/base-error.util";
import { prisma } from "../../../config/database.config";
import { Prisma } from "@prisma/client";
import { CreateServiceRequestDto } from "../dtos/service-request.request.dto";
import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import {
  ServiceRequestResponseDto,
  ServiceRequestDetailResponseDto,
  ServiceRequestFullResponseDto,
  ServiceRequestDetailFullResponseDto,
  ServiceRequestResultResponseDto,
  ServiceRequestSelectedConfigResponseDto,
} from "../dtos/service-request.response.dto";
import {
  ServiceRequestRepository,
  ServiceRequestWithDetails,
  CreateServiceRequestPayload,
} from "../repositories/service-request.repository";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { UserRepository } from "../../users/repositories/user.repository";
import { ServiceItemRepository } from "../../service-item/repositories/service-item.request.repository";

export class ServiceRequestService {
  private serviceRequestRepository = new ServiceRequestRepository();
  private medicalRecordRepository = new MedicalRecordRepository();
  private userRepository = new UserRepository();
  private serviceItemRepository = new ServiceItemRepository();

  public async getRequestById(
    requestId: string,
    clinicId?: string
  ): Promise<ServiceRequestFullResponseDto> {
    const request = await this.serviceRequestRepository.findByIdWithDetailsAndResults(
      requestId
    );
    if (!request) {
      throw new BaseError(404, "Không tìm thấy phiếu chỉ định");
    }

    if (
      clinicId &&
      request.medicalRecord?.clinicId &&
      request.medicalRecord.clinicId !== clinicId
    ) {
      throw new BaseError(403, "Phiếu chỉ định không thuộc phòng khám");
    }

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

    const details: ServiceRequestDetailFullResponseDto[] = request.details.map(
      (detail) => {
        const serviceItem = detail.serviceItem;
        const configMetaMap = new Map(
          (serviceItem?.configs ?? []).map((cfg) => [cfg.configId, cfg])
        );
        const selectedOptions = detail.selectedOptions as
          | {
              selectedConfigs?: {
                configId: string;
                configCode?: string | null;
                selectedValues?: string[];
                totalSurcharge?: number;
              }[];
            }
          | null
          | undefined;
        const selectedConfigs: ServiceRequestSelectedConfigResponseDto[] =
          selectedOptions?.selectedConfigs?.map((cfg) => {
            const meta = configMetaMap.get(cfg.configId);
            return {
              configId: cfg.configId,
              configCode: cfg.configCode ?? meta?.configCode ?? null,
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
      }
    );

    return {
      requestId: request.requestId,
      requestCode: request.requestCode ?? null,
      recordId: request.recordId ?? null,
      recordCode: request.medicalRecord?.recordCode ?? null,
      orderingDoctorId: request.orderingDoctorId ?? null,
      diagnoses: request.diagnoses
        ? (request.diagnoses as unknown as MedicalDiagnosisDto)
        : null,
      isPatientRequested: request.isPatientRequested ?? null,
      receiveResultAtClinic: request.receiveResultAtClinic ?? null,
      isForFollowUp: request.isForFollowUp ?? null,
      note: request.note ?? null,
      createdAt: request.createdAt ? request.createdAt.toISOString() : null,
      patientId: request.medicalRecord?.patientId ?? null,
      details,
    };
  }

  public async createServiceRequest(
    data: CreateServiceRequestDto,
    clinicId?: string
  ): Promise<ServiceRequestResponseDto> {
    const created = await prisma.$transaction(async (tx) => {
      if (!data.details || data.details.length === 0) {
        throw new BaseError(400, "Phiếu chỉ định phải có ít nhất 1 dịch vụ cận lâm sàng");
      }

      const record = await this.medicalRecordRepository.findById(data.recordId, tx);
      if (!record) {
        throw new BaseError(404, "Không tìm thấy bệnh án");
      }

      if (clinicId && record.clinicId && record.clinicId !== clinicId) {
        throw new BaseError(403, "Bệnh án này không thuộc phòng khám hiện tại");
      }

      const orderingDoctorId = data.orderingDoctorId ?? "";
      const orderingDoctor = await this.userRepository.findUserById(orderingDoctorId, tx);
      if (!orderingDoctor) {
        throw new BaseError(404, "Không tìm thấy bác sĩ chỉ định");
      }

      if (clinicId && orderingDoctor.clinicId && orderingDoctor.clinicId !== clinicId) {
        throw new BaseError(403, "Bác sĩ không thuộc phòng khám hiện tại");
      }

      if (
        record.clinicId &&
        orderingDoctor.clinicId &&
        record.clinicId !== orderingDoctor.clinicId
      ) {
        throw new BaseError(400, "Bệnh án và bác sĩ không cùng phòng khám");
      }

      const itemIds = data.details.map((detail) => detail.itemId);
      const uniqueItemIds = [...new Set(itemIds)];
      if (uniqueItemIds.length !== itemIds.length) {
        throw new BaseError(400, "Không được chọn trùng lặp dịch vụ trong cùng một phiếu");
      }

      const items = await this.serviceItemRepository.findActiveItemsWithConfigsByIds(
        uniqueItemIds,
        tx
      );

      if (items.length !== uniqueItemIds.length) {
        throw new BaseError(400, "Một hoặc nhiều dịch vụ không tồn tại hoặc đang ngừng hoạt động");
      }

      const itemConfigMap = new Map<
        string,
        {
          basePrice: number;
          configs: Map<string, { configCode: string | null; options: Map<string, number> }>;
        }
      >();
      for (const item of items) {
        const configMetaMap = new Map<
          string,
          { configCode: string | null; options: Map<string, number> }
        >();
        for (const config of item.configs) {
          const optionsMap = new Map<string, number>();
          const metaOptions = Array.isArray((config.metaData as { options?: unknown })?.options)
            ? (config.metaData as { options?: { value?: string; surcharge?: number }[] }).options ??
              []
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
        const basePrice = item.basePrice ? Number(item.basePrice.toString()) : 0;
        itemConfigMap.set(item.itemId, { basePrice, configs: configMetaMap });
      }

      const detailsToCreate: CreateServiceRequestPayload["details"] = [];

      for (const detail of data.details) {
        // if (!detail.selectedConfigs || detail.selectedConfigs.length === 0) {
        //   throw new BaseError(400, "Chưa chọn cấu hình cho dịch vụ cận lâm sàng");
        // }

        const itemMeta = itemConfigMap.get(detail.itemId);
        if (!itemMeta) {
          throw new BaseError(400, "Dịch vụ không hợp lệ cho phiếu chỉ định");
        }

        const selectedConfigs = detail.selectedConfigs ?? [];
        const configIds = selectedConfigs.map((cfg) => cfg.configId);
        const uniqueConfigIds = [...new Set(configIds)];
        if (uniqueConfigIds.length !== configIds.length) {
          throw new BaseError(400, "Không được chọn trùng lặp cấu hình cận lâm sàng");
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
            throw new BaseError(400, "Cấu hình không thuộc dịch vụ đã chọn");
          }

          let configSurcharge = 0;
          if (configMeta.options.size > 0) {
            if (!config.selectedValues || config.selectedValues.length === 0) {
              throw new BaseError(400, "Giá trị chọn của cấu hình không hợp lệ");
            }
            for (const selectedValue of config.selectedValues) {
              const optionSurcharge = configMeta.options.get(selectedValue);
              if (optionSurcharge === undefined) {
                throw new BaseError(400, "Gia tri chon khong thuoc cau hinh");
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

      return await this.serviceRequestRepository.create(
        {
          recordId: data.recordId,
          orderingDoctorId: data.orderingDoctorId,
          diagnoses: data.diagnoses
            ? (data.diagnoses as unknown as Prisma.InputJsonValue)
            : null,
          isPatientRequested: data.isPatientRequested ?? false,
          receiveResultAtClinic: data.receiveResultAtClinic ?? false,
          isForFollowUp: data.isFollowUp,
          note: data.note ?? null,
          details: detailsToCreate,
        },
        tx
      );
    });

    return this.mapToResponseDto(created);
  }

  private mapToResponseDto(
    request: ServiceRequestWithDetails
  ): ServiceRequestResponseDto {
    return {
      requestId: request.requestId,
      requestCode: request.requestCode ?? null,
      recordId: request.recordId ?? null,
      orderingDoctorId: request.orderingDoctorId ?? null,
      diagnoses: request.diagnoses
        ? (request.diagnoses as unknown as MedicalDiagnosisDto)
        : null,
      isPatientRequested: request.isPatientRequested ?? null,
      receiveResultAtClinic: request.receiveResultAtClinic ?? null,
      isForFollowUp: request.isForFollowUp ?? null,
      note: request.note ?? null,
      createdAt: request.createdAt ? request.createdAt.toISOString() : null,
      details: request.details.map(
        (detail): ServiceRequestDetailResponseDto => ({
          requestDetailId: detail.requestDetailId,
          itemId: detail.itemId ?? null,
          itemCode: detail.serviceItem?.itemCode ?? null,
          itemName: detail.serviceItem?.name ?? null,
          selectedOptions: detail.selectedOptions ?? null,
        })
      ),
    };
  }
}
