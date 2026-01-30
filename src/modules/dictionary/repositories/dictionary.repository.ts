import { DictionaryRequestDto } from "../dtos/dictionary.request.dto";
import { prisma } from "../../../config/database.config";

export class DictionaryRepository {
  public async create(
    data: DictionaryRequestDto,
  ): Promise<DictionaryRequestDto> {
    return await prisma.dictionary.create({ data });
  }

  public async findByKey(key: string): Promise<DictionaryRequestDto | null> {
    return await prisma.dictionary.findUnique({ where: { key } });
  }

  public async update(oldKey: string, newKey: string, value: string | null) {
    return await prisma.dictionary.update({
      where: { key: oldKey },
      data: {
        key: newKey,
        value,
      },
    });
  }

  public async delete(key: string): Promise<DictionaryRequestDto | null> {
    const existing = await this.findByKey(key);
    if (!existing) {
      return null;
    }
    return await prisma.dictionary.delete({ where: { key } });
  }

  public async findAll(
    page: number,
    size: number,
    search?: string,
    sortBy: "key" | "value" = "key",
    sort: "asc" | "desc" = "asc",
  ): Promise<{ items: DictionaryRequestDto[]; totalItems: number }> {
    const where = search
      ? {
          OR: [
            { key: { contains: search, mode: "insensitive" as const } },
            { value: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, totalItems] = await prisma.$transaction([
      prisma.dictionary.findMany({
        where,
        orderBy: { [sortBy]: sort },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.dictionary.count({ where }),
    ]);

    return { items, totalItems };
  }

  public async insertBulk(items: DictionaryRequestDto[]) {
    return await prisma.dictionary.createMany({
      data: items,
      skipDuplicates: true,
    });
  }

  public async deleteBulk(keys: string[]) {
    return await prisma.dictionary.deleteMany({
      where: { key: { in: keys } },
    });
  }
}
