import { prisma } from "../../../config/database.config";
import { UploadFileRequestDto } from "../dtos/upload-file.request.dto";

export class FileRepository {
  public async findByMedicalRecordId(recordId: string) {
    return await prisma.file.findUnique({
      where: {
        medicalRecordId: recordId
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
}
