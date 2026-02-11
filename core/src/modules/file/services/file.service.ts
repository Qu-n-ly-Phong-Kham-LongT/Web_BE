import { Request } from "express";
import path from "path";
import { BaseError } from "../../../utils/base-error.util";
import { FileRepository } from "../repositories/file.repository";
import { FileType } from "@prisma/client";
import fs from "fs";
import { formatFileName } from "../../../utils/file-name.util";
import { createPagination } from "../../../utils/pagination.util";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const normalizeRelativePath = (relativePath: string) =>
  relativePath.replace(/^[/\\]+/, "");

const resolvePublicPath = (relativePath: string) =>
  path.join(PUBLIC_DIR, normalizeRelativePath(relativePath));
export class FileService {
  private fileRepository = new FileRepository();

  private mapFileResponse(file: {
    fileID: string;
    relativePath: string;
    type: FileType;
    size: number;
    createdAt: Date;
  }) {
    return {
      fileId: file.fileID,
      relativePath: file.relativePath,
      url: `${process.env.BASE_URL}${file.relativePath}`,
      type: file.type,
      size: file.size,
      createdAt: file.createdAt,
    };
  }

  public async uploadFile(req: Request): Promise<any> {
    const getQueryString = (value: unknown): string | undefined => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      return undefined;
    };

    if (!req.file) {
      throw new BaseError(400, "Vui lòng chọn file để upload");
    }

    const type = String(req.query.type ?? "") as FileType;
    const medicalRecordId = getQueryString(req.query.medicalRecordId);
    const prescriptionId = getQueryString(req.query.prescriptionId);
    const serviceRequestId = getQueryString(req.query.serviceRequestId);
    const serviceResultId = getQueryString(req.query.serviceResultId);
    const providedIds = [
      medicalRecordId,
      prescriptionId,
      serviceRequestId,
      serviceResultId,
    ].filter(Boolean);

    if (providedIds.length > 1) {
      throw new BaseError(400, "Chỉ bắt buộc điền 1 loại id bản ghi cần lưu");
    }

    if (type === FileType.SERVICE_RESULT) {
      const hasServiceRequest = !!serviceRequestId;
      const hasMedicalRecord = !!medicalRecordId;

      if (hasServiceRequest === hasMedicalRecord) {
        throw new BaseError(
          400,
          "SERVICE_RESULT chỉ được gắn serviceRequestId hoặc medicalRecordId (không được cả hai)",
        );
      }
      if (!serviceRequestId && !medicalRecordId) {
        throw new BaseError(
          400,
          "Kết quả cần liên kết với bệnh án hoặc phiếu chỉ định",
        );
      }
    }
    const relativePath = path
      .join("/uploads", type, req.file.filename)
      .replace(/\\/g, "/");

    const fileRecord = await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      medicalRecordId,
      prescriptionId,
      serviceRequestId,
      serviceResultId,
    });

    return fileRecord;
  }

  public async deleteByRelativePath(relativePath: string): Promise<void> {
    const fullPath = resolvePublicPath(relativePath);
    await this.fileRepository.deleteByRelativePath(relativePath);

    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error?.code === "ENOENT") {
        return;
      }
      console.error(`Xoá thất bại: ${fullPath}`, err);
      throw new BaseError(500, "Xoá thất bại");
    }
  }

  public async saveMedicalRecordDocx(
    recordId: string,
    recordCode: string | null | undefined,
    buffer: Buffer,
  ) {
    const type = FileType.MEDICAL_RECORD;
    const fileName = formatFileName(`${recordCode || recordId}.docx`);
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing = await this.fileRepository.findByMedicalRecordId(recordId);
    if (existing?.relativePath) {
      await this.deleteByRelativePath(existing.relativePath);
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    return await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: buffer.length,
      medicalRecordId: recordId,
    });
  }

  public async saveMedicalRecordPdf(
    recordId: string,
    recordCode: string | null | undefined,
    buffer: Buffer,
  ) {
    const type = FileType.MEDICAL_RECORD;
    const fileName = formatFileName(`${recordCode || recordId}.pdf`);
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing = await this.fileRepository.findMedicalRecordFiles(recordId);
    for (const file of existing) {
      if (file.relativePath) await this.deleteByRelativePath(file.relativePath);
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    return await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: "application/pdf",
      size: buffer.length,
      medicalRecordId: recordId,
    });
  }

  public async findByMedicalRecordId(recordId: string) {
    const file = await this.fileRepository.findByMedicalRecordId(recordId);
    if (!file) {
      throw new BaseError(404, "Không tìm thấy file");
    }

    return this.mapFileResponse(file);
  }

  public async findResultFilesByMedicalRecordId(recordId: string) {
    const files =
      await this.fileRepository.findResultFilesByMedicalRecordId(recordId);
    return files.map((f) => this.mapFileResponse(f));
  }

  public async findByRecordId(recordId: string) {
    return await this.fileRepository.findByMedicalRecordId(recordId);
  }

  public async saveServiceRequestPdf(
    requestId: string,
    requestCode: string | null | undefined,
    buffer: Buffer,
  ) {
    const type = FileType.SERVICE_REQUEST;
    const fileName = formatFileName(`${requestCode || requestId}.pdf`);
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing =
      await this.fileRepository.findByServiceRequestId(requestId);
    if (existing?.relativePath) {
      await this.deleteByRelativePath(existing.relativePath);
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    const fileRecord = await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: "application/pdf",
      size: buffer.length,
      serviceRequestId: requestId,
    });

    return this.mapFileResponse(fileRecord);
  }

  public async savePrescripitonPdf(
    prescriptionId: string,
    prescriptionCode: string | null | undefined,
    buffer: Buffer,
  ) {
    const type = FileType.SERVICE_REQUEST;
    const fileName = formatFileName(
      `${prescriptionCode || prescriptionId}.pdf`,
    );
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing =
      await this.fileRepository.findByPrescriptionId(prescriptionId);
    if (existing?.relativePath) {
      await this.deleteByRelativePath(existing.relativePath);
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    const fileRecord = await this.fileRepository.createFileRecord({
      relativePath,
      type,
      mimeType: "application/pdf",
      size: buffer.length,
      prescriptionId: prescriptionId,
    });

    return this.mapFileResponse(fileRecord);
  }

  public async findByServiceRequestId(requestId: string) {
    const file = await this.fileRepository.findByServiceRequestId(requestId);
    if (!file) {
      throw new BaseError(404, "Không tìm thấy file");
    }

    return this.mapFileResponse(file);
  }

  public async findByPrescriptionId(prescriptionId: string) {
    const file = await this.fileRepository.findByPrescriptionId(prescriptionId);
    if (!file) {
      throw new BaseError(404, "Không tìm thấy file");
    }

    return this.mapFileResponse(file);
  }

  public async deleteServiceResults(requestId: string): Promise<void> {
    const type = FileType.SERVICE_RESULT;

    if (!requestId) {
      throw new BaseError(400, "Vui lòng nhập phiếu chỉ định");
    }

    const files = await this.fileRepository.findByRequestIdAndType(
      requestId,
      type,
    );

    if (files.length === 0) {
      return;
    }
    await this.fileRepository.deleteByRequestIdAndType(requestId, type);

    for (const file of files) {
      const fullPath = resolvePublicPath(file.relativePath);
      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      } catch (err) {
        console.error(`Thất bại khi xóa file vật lý: ${fullPath}`, err);
      }
    }
  }

  public async getFiles(query: {
    type: FileType;
    id?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 10;
    const { type, id } = query;

    const sortOrder = query.sort === "asc" ? "asc" : "desc";
    let filters: any = { type };

    switch (type) {
      case FileType.MEDICAL_RECORD:
        if (id) filters.medicalRecordId = id;
        break;
      case FileType.SERVICE_REQUEST:
        if (!id)
          throw new BaseError(400, `Type ${type} yêu cầu ID Service Request`);
        filters.serviceRequestId = id;
        break;
      case FileType.SERVICE_RESULT:
        if (!id)
          throw new BaseError(
            400,
            `Kết quả cần truyền Id của phiếu chỉ định OR bệnh án`,
          );
        filters.OR = [{ serviceRequestId: id }, { medicalRecordId: id }];
        break;
      case FileType.PRESCRIPTION:
        if (!id) throw new BaseError(400, "Yêu cầu Prescription ID");
        filters.prescriptionId = id;
        break;
    }

    const { items, totalItems } =
      await this.fileRepository.findFilesWithPagination({
        filters,
        page,
        size,
        sort: sortOrder,
      });

    return {
      data: items.map((f) => this.mapFileResponse(f)),
      pagination: createPagination(page, size, totalItems),
    };
  }
}
