import { Icd10Dictionary } from "@prisma/client";
import { Icd10ListResponseDto, Icd10RequestDto, Icd10ResponseDto } from "../dtos/icd-10.dto";
import { Icd10Repository } from "../repositories/icd-10.repository";
import { BaseError } from "../../../utils/base-error.util";
import { createPagination } from "../../../utils/pagination.util";

export class Icd10Service {
  private Icd10Repository = new Icd10Repository();

  public async createIcd10(
    createData: Icd10RequestDto
  ): Promise<Icd10Dictionary> {
    const isExisting = await this.Icd10Repository.findByCode(createData.code);
    if (isExisting) {
      throw new BaseError(409, "Mã ICD-10 đã tồn tại trong hệ thống");
    }

    return await this.Icd10Repository.createIcd10({
      code: createData.code,
      description: createData.description,
    });
  }

  public async deleteIcd10(code: string) {
    const icd = await this.Icd10Repository.findByCode(code);
    if (!icd) {
      throw new BaseError(404, "ICD-10 này không tồn tại")
    }

    return await this.Icd10Repository.deleteByCode(code);
  }

  public async updateIcd10(
    code: string,
    updateData: Icd10RequestDto
  ): Promise<Icd10Dictionary> {
    const newCode = updateData.code;
    if (newCode && newCode !== code) {
      const isExisting = await this.Icd10Repository.findByCode(newCode);
      if (isExisting && isExisting.code !== code) {
        throw new BaseError(409, "Mã ICD-10 đã tồn tại trong hệ thống");
      }
    }
    return await this.Icd10Repository.updateIcd10(code, {
      code: updateData.code,
      description: updateData.description,
    });
  }

  public async getAllIcd10(
    page: number = 1,
    size: number = 10,
    search?: string,
    sortBy: "code" | "description" = "code",
    sortDirection: "asc" | "desc" = "asc"
  ): Promise<Icd10ListResponseDto> {
    const { entries, totalItems } = await this.Icd10Repository.getAllIcd10(
      page,
      size,
      search,
      sortBy,
      sortDirection
    );

    const pagination = createPagination(page, size, totalItems);

    return {
      icd10s: entries.map((entry) => this.mapToResponse(entry)),
      pagination,
    };
  }

  private mapToResponse(entry: Icd10Dictionary): Icd10ResponseDto {
    return {
      code: entry.code,
      description: entry.description ?? undefined,
    };
  }
}
