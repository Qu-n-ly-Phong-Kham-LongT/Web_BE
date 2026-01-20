import { prisma } from "../../../config/database.config";
import { Prisma, Icd10Dictionary } from "@prisma/client";

export class Icd10Repository {
  public async createIcd10(
    createData: Prisma.Icd10DictionaryCreateInput,
  ): Promise<Icd10Dictionary> {
    return await prisma.icd10Dictionary.create({
      data: createData,
    });
  }

  public async updateIcd10(
    code: string,
    updateData: Prisma.Icd10DictionaryUpdateInput,
  ): Promise<Icd10Dictionary> {
    return await prisma.icd10Dictionary.update({
      where: { code },
      data: updateData,
    });
  }

  public async findByCode(code: string): Promise<Icd10Dictionary | null> {
    return await prisma.icd10Dictionary.findUnique({
      where: { code },
    });
  }

  public async deleteByCode(code: string): Promise<Icd10Dictionary> {
    return await prisma.icd10Dictionary.delete({
      where: { code },
    });
  }

  public async getAllIcd10(
    page: number = 1,
    size: number = 10,
    search?: string,
    sortBy: "code" | "description" = "code",
    sortDirection: "asc" | "desc" = "asc",
  ): Promise<{ entries: Icd10Dictionary[]; totalItems: number }> {
    const skip = (page - 1) * size;
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const orderBy =
      sortBy === "code"
        ? { code: sortDirection }
        : { description: sortDirection };

    const [entries, totalItems] = await Promise.all([
      prisma.icd10Dictionary.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      prisma.icd10Dictionary.count({ where }),
    ]);

    return { entries, totalItems };
  }
}
