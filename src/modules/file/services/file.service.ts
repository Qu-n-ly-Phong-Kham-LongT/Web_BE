import { Request } from "express";
import path from "path";
import { BaseError } from "../../../utils/base-error.util";
import { FileRepository } from "../repositories/file.repository";
import { FileType } from "@prisma/client";
import fs from "fs";
import { formatFileName } from "../../../utils/file-name.util";

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
    buffer: Buffer
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
    buffer: Buffer
  ) {
    const type = FileType.MEDICAL_RECORD;
    const fileName = formatFileName(`${recordCode || recordId}.pdf`);
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
      mimeType: "application/pdf",
      size: buffer.length,
      medicalRecordId: recordId,
    });
  }

  public async findByMedicalRecordId(recordId: string) {
    const file = await this.fileRepository.findByMedicalRecordId(recordId);
    if (!file) {
      throw new BaseError(404, "Khong tim thay file");
    }

    return this.mapFileResponse(file);
  }

  public async saveServiceRequestPdf(
    requestId: string,
    requestCode: string | null | undefined,
    buffer: Buffer
  ) {
    const type = FileType.SERVICE_REQUEST;
    const fileName = formatFileName(`${requestCode || requestId}.pdf`);
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing = await this.fileRepository.findByServiceRequestId(requestId);
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
    buffer: Buffer
  ) {
    const type = FileType.SERVICE_REQUEST;
    const fileName = formatFileName(`${prescriptionCode || prescriptionId}.pdf`);
    const relativePath = path
      .join("/uploads", type, fileName)
      .replace(/\\/g, "/");
    const fullPath = resolvePublicPath(relativePath);

    const existing = await this.fileRepository.findByPrescriptionId(prescriptionId);
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
      throw new BaseError(404, "Không tìm thấy file")
    }

    return this.mapFileResponse(file);
  }
}
