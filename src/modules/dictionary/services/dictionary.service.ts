import { BaseError } from "../../../utils/base-error.util";
import { DictionaryRequestDto } from "../dtos/dictionary.request.dto";
import { DictionaryRepository } from "../repositories/dictionary.repository";
import { createPagination } from "../../../utils/pagination.util";

export class DictionaryService {
  private dictionaryRepository = new DictionaryRepository();

  public async create(data: DictionaryRequestDto) {
    const existing = await this.dictionaryRepository.findByKey(data.key);
    if (existing) {
      throw new BaseError(409, "Tù khoá đã tồn tại");
    }

    return await this.dictionaryRepository.create(data);
  }

  public async getByKey(key: string) {
    const dict = await this.dictionaryRepository.findByKey(key);
    if (!dict) {
      throw new BaseError(404, "Không tìm thấy từ khoá");
    }

    return dict;
  }

  public async update(oldKey: string, newKey: string, value: string | null) {
    const existing = await this.dictionaryRepository.findByKey(oldKey);

    if (!existing) {
        throw new BaseError(404, "Không tìm thấy từ khoá")
    }
    if (oldKey !== newKey) {
      const exists = await this.dictionaryRepository.findByKey(newKey);
      if (exists) throw new BaseError(409, "Từ khoá mới đã tồn tại");
    }
    return await this.dictionaryRepository.update(oldKey, newKey, value);
  }

  public async delete(key: string) {
    const deleted = await this.dictionaryRepository.delete(key);
    if (!deleted) {
      throw new BaseError(404, "Không tìm thấy từ khoá");
    }
    return deleted;
  }

  public async list(
    page = 1,
    size = 10,
    search?: string,
    sortBy: "key" | "value" = "key",
    sort: "asc" | "desc" = "asc",
  ) {
    const safePage = Math.max(1, page);
    const safeSize = Math.max(1, size);
    const normalizedSearch = search?.trim() || undefined;

    const { items, totalItems } = await this.dictionaryRepository.findAll(
      safePage,
      safeSize,
      normalizedSearch,
      sortBy,
      sort,
    );

    return {
      items,
      pagination: createPagination(safePage, safeSize, totalItems),
    };
  }

  public async insertBulk(items: DictionaryRequestDto[]) {
    return await this.dictionaryRepository.insertBulk(items);
  }

  public async deleteBulk(keys: string[]) {
    return await this.dictionaryRepository.deleteBulk(keys);
  }
}
