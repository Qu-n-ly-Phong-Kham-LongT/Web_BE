import { BaseError } from "../../../utils/base-error.util";
import { prisma } from "../../../config/database.config";
import { InputType, Prisma } from "@prisma/client";
import {
  ServiceResultItemDto,
  CreateServiceResultBulkRequestDto,
  ServiceResultDetailDto,
} from "../dtos/service-result.request.dto";
import { ServiceResultResponseDto } from "../dtos/service-result.response.dto";
import { ServiceResultRepository } from "../repositories/service-result.repository";

export class ServiceResultService {
  private serviceResultRepository = new ServiceResultRepository();

  public async createServiceResultsBulk(
    data: CreateServiceResultBulkRequestDto
  ): Promise<ServiceResultResponseDto[]> {
    return await prisma.$transaction(async (tx) => {
      const created: ServiceResultResponseDto[] = [];
      for (const detail of data.details) {
        const items = await this.createResultsForDetail(
          {
            requestId: data.requestId,
            detailId: detail.detailId,
            itemId: detail.itemId,
            results: detail.results,
          },
          tx
        );
        created.push(...items.map((item) => this.mapToResponseDto(item)));
      }
      return created;
    });
  }

  public async upsertServiceResultsBulk(
    data: CreateServiceResultBulkRequestDto
  ): Promise<ServiceResultResponseDto[]> {
    return await prisma.$transaction(async (tx) => {
      const updated: ServiceResultResponseDto[] = [];
      for (const detail of data.details) {
        const items = await this.upsertResultsForDetail(
          {
            requestId: data.requestId,
            detailId: detail.detailId,
            itemId: detail.itemId,
            results: detail.results,
          },
          tx
        );
        updated.push(...items);
      }
      return updated;
    });
  }

  private async createResultsForDetail(
    data: ServiceResultDetailDto & { requestId: string },
    tx: Prisma.TransactionClient
  ) {
    const detail = await this.getDetailContext(
      data.requestId,
      data.detailId,
      data.itemId,
      tx
    );
    const configIds = data.results.map((r) => r.configId);
    const uniqueConfigIds = [...new Set(configIds)];
    if (uniqueConfigIds.length !== configIds.length) {
      throw new BaseError(400, "Không được trùng cấu hình kết quả");
    }

    const existing = await this.serviceResultRepository.findByDetailAndConfigs(
      detail.detail.requestDetailId,
      configIds,
      tx
    );
    if (existing.length > 0) {
      throw new BaseError(409, "Kết quả đã tồn tại");
    }

    const resultsToCreate: Prisma.ServiceResultUncheckedCreateInput[] = [];
    for (const result of data.results) {
      const config = detail.configMap.get(result.configId);
      if (!config) {
        throw new BaseError(400, "Cấu hình không thuộc dịch vụ");
      }

      this.validateResultValue(config.inputType ?? InputType.Text, config.metaData, result);

      const executedAt = result.executedAt ? new Date(result.executedAt) : undefined;
      if (result.executedAt && Number.isNaN(executedAt?.getTime())) {
        throw new BaseError(400, "Thời gian thực hiện không hợp lệ");
      }

      const normalizedUnit = this.normalizeUnit(result.unit);
      resultsToCreate.push({
        detailId: detail.detail.requestDetailId,
        requestId: detail.detail.requestId ?? null,
        itemId: detail.detail.itemId ?? null,
        configId: result.configId,
        indicatorName:
          result.indicatorName ?? config.displayName ?? config.configCode ?? null,
        valueString: result.valueString ?? null,
        valueNumber: result.valueNumber !== undefined ? result.valueNumber : null,
        unit: normalizedUnit ?? config.unit ?? null,
        executedAt: executedAt ?? undefined,
      });
    }

    return await this.serviceResultRepository.createMany(resultsToCreate, tx);
  }

  private async upsertResultsForDetail(
    data: ServiceResultDetailDto & { requestId: string },
    tx: Prisma.TransactionClient
  ): Promise<ServiceResultResponseDto[]> {
    const detail = await this.getDetailContext(
      data.requestId,
      data.detailId,
      data.itemId,
      tx
    );
    const configIds = data.results.map((r) => r.configId);
    const uniqueConfigIds = [...new Set(configIds)];
    if (uniqueConfigIds.length !== configIds.length) {
      throw new BaseError(400, "Không được trùng cấu hình kết quả");
    }

    const existing = await this.serviceResultRepository.findByDetailAndConfigs(
      detail.detail.requestDetailId,
      configIds,
      tx
    );
    const existingMap = new Map(existing.map((r) => [r.configId, r]));
    const output: ServiceResultResponseDto[] = [];

    for (const result of data.results) {
      const config = detail.configMap.get(result.configId);
      if (!config) {
        throw new BaseError(400, "Cấu hình không thuộc dịch vụ");
      }

      this.validateResultValue(config.inputType ?? InputType.Text, config.metaData, result);

      const executedAt = result.executedAt ? new Date(result.executedAt) : undefined;
      if (result.executedAt && Number.isNaN(executedAt?.getTime())) {
        throw new BaseError(400, "Thời gian thực hiện không hợp lệ");
      }

      const existingResult = existingMap.get(result.configId ?? "");
      const normalizedUnit = this.normalizeUnit(result.unit);
      if (existingResult) {
        const updated = await this.serviceResultRepository.updateById(
          existingResult.resultId,
          {
            indicatorName:
              result.indicatorName ?? config.displayName ?? config.configCode ?? null,
            valueString: result.valueString ?? null,
            valueNumber: result.valueNumber !== undefined ? result.valueNumber : null,
            unit: normalizedUnit ?? config.unit ?? null,
            executedAt: executedAt ?? undefined,
          },
          tx
        );
        output.push(this.mapToResponseDto(updated));
        continue;
      }

      const created = await this.serviceResultRepository.createMany(
        [
          {
            detailId: detail.detail.requestDetailId,
            requestId: detail.detail.requestId ?? null,
            itemId: detail.detail.itemId ?? null,
            configId: result.configId,
            indicatorName:
              result.indicatorName ?? config.displayName ?? config.configCode ?? null,
            valueString: result.valueString ?? null,
            valueNumber: result.valueNumber !== undefined ? result.valueNumber : null,
            unit: normalizedUnit ?? config.unit ?? null,
            executedAt: executedAt ?? undefined,
          },
        ],
        tx
      );
      output.push(this.mapToResponseDto(created[0]));
    }

    return output;
  }

  private async getDetailContext(
    requestId: string,
    detailId: string | undefined,
    itemId: string | undefined,
    tx: Prisma.TransactionClient
  ) {
    let detail = null;
    if (detailId) {
      detail = await tx.serviceRequestDetail.findUnique({
        where: { requestDetailId: detailId },
        include: {
          serviceRequest: true,
          serviceItem: { include: { configs: true } },
        },
      });
    } else if (itemId) {
      detail = await tx.serviceRequestDetail.findFirst({
        where: { requestId, itemId },
        include: {
          serviceRequest: true,
          serviceItem: { include: { configs: true } },
        },
      });
    } else {
      throw new BaseError(400, "Bad Request");
    }
    if (!detail || !detail.serviceRequest) {
      throw new BaseError(404, "Không tìm thấy phiếu chỉ định");
    }
    if (detail.requestId !== requestId) {
      throw new BaseError(400, "Chi tiết không thuộc phiếu chỉ định");
    }
    if (itemId && detail.itemId && detail.itemId !== itemId) {
      throw new BaseError(400, "Dịch vụ không khớp với phiếu chỉ định");
    }
    if (!detail.serviceItem || !detail.itemId) {
      throw new BaseError(400, "Dịch vụ không hợp lệ");
    }
    const configMap = new Map(
      detail.serviceItem.configs.map((cfg) => [cfg.configId, cfg])
    );
    return { detail, configMap };
  }

  private validateResultValue(
    inputType: InputType,
    metaData: unknown,
    result: ServiceResultItemDto
  ) {
    void inputType;
    void metaData;
    void result;
  }

  private mapToResponseDto(item: {
    resultId: string;
    detailId: string | null;
    requestId: string | null;
    itemId: string | null;
    configId: string | null;
    indicatorName: string | null;
    valueString: string | null;
    valueNumber: Prisma.Decimal | number | null;
    unit: string | null;
    executedAt: Date | null;
  }): ServiceResultResponseDto {
    return {
      resultId: item.resultId,
      detailId: item.detailId ?? null,
      requestId: item.requestId ?? null,
      itemId: item.itemId ?? null,
      configId: item.configId ?? null,
      indicatorName: item.indicatorName ?? null,
      valueString: item.valueString ?? null,
      valueNumber:
        item.valueNumber !== null && item.valueNumber !== undefined
          ? Number(item.valueNumber)
          : null,
      unit: item.unit ?? null,
      executedAt: item.executedAt ? item.executedAt.toISOString() : null,
    };
  }

  private normalizeUnit(unit: string | null | undefined): string | null {
    if (typeof unit !== "string") {
      return null;
    }
    const trimmed = unit.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
