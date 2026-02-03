import { FileType } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { UploadFileRequestDto } from "../dtos/upload-file.request.dto";

export class FileRepository {
  public async findByMedicalRecordId(recordId: string) {
    return await prisma.file.findUnique({
      where: {
        medicalRecordId: recordId,
      },
    });
  }

  public async findByServiceRequestId(requestId: string) {
    return await prisma.file.findFirst({
      where: {
        serviceRequestId: requestId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  public async findByPrescriptionId(prescriptionId: string) {
    return await prisma.file.findUnique({
      where: {
        prescriptionId: prescriptionId,
      },
    });
  }

  public async findByFileId(fileId: string) {
    return await prisma.file.findUnique({
      where: { fileID: fileId },
    });
  }

  public async createFileRecord(data: UploadFileRequestDto) {
    return await prisma.file.create({
      data: {
        relativePath: data.relativePath,
        type: data.type,
        mimeType: data.mimeType,
        size: data.size,
        medicalRecordId: data.medicalRecordId,
        prescriptionId: data.prescriptionId,
        serviceRequestId: data.serviceRequestId,
        serviceResultId: data.serviceResultId,
      },
    });
  }

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    await prisma.file.deleteMany({
      where: {
        relativePath: relativePath,
      },
    });
  }

  public async deleteByServiceRequestId(requestId: string): Promise<void> {
    await prisma.file.deleteMany({
      where: {
        serviceRequestId: requestId,
      },
    });
  }

  public async deleteByPrescriptionId(prescriptionId: string): Promise<void> {
    await prisma.file.delete({
      where: {
        prescriptionId: prescriptionId,
      },
    });
  }

  public async findByRequestIdAndType(requestId: string, type: FileType) {
  return await prisma.file.findMany({
    where: {
      serviceRequestId: requestId,
      type: type,
    },
  });
}

public async deleteByRequestIdAndType(requestId: string, type: FileType) {
  return await prisma.file.deleteMany({
    where: {
      serviceRequestId: requestId,
      type: type,
    },
  });
}

  public async findFilesWithPagination(params: {
    filters: any;
    page: number;
    size: number;
    sort?: "asc" | "desc";
  }) {
    const { filters, page, size, sort = 'desc' } = params;
    const skip = (page - 1) * size;

    const [items, totalItems] = await Promise.all([
      prisma.file.findMany({
        where: filters,
        skip,
        take: size,
        orderBy: { createdAt: sort },
      }),
      prisma.file.count({ where: filters }),
    ]);

    return { items, totalItems };
  }
}
