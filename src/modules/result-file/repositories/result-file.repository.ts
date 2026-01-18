import { ResultFile } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { ResultFileDto } from "../dtos/result-file.request.dto";

export class ResultFileRepository {
  public async createMany(data: ResultFileDto[]) {
    return await prisma.resultFile.createMany({
      data: data,
    });
  }

  public async createFileRecord(data: ResultFileDto): Promise<ResultFile> {
    return await prisma.resultFile.create({
      data: data,
    });
  }

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    await prisma.resultFile.deleteMany({
      where: {
        relativePath: relativePath,
      },
    });
  }

  public async findByServiceRequestId(
    requestId: string,
  ): Promise<ResultFile[]> {
    return await prisma.resultFile.findMany({
      where: { serviceRequestId: requestId },
    });
  }
}
