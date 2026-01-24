import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import { BaseError } from "../../../utils/base-error.util";
import { FullMedicalRecordDto } from "../dtos/medical-record-detail.dto";
import { SharedRepository } from "../repositories/shared.repository";
import { FileService } from "../../file/services/file.service";
import { generateBarcodeBuffer } from "../../../utils/barcode.util";
import { convertDocxToPdf } from "../../../utils/docx-to-pdf.util";
import { FileRepository } from "../../file/repositories/file.repository";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { enqueuePrintJob } from "../../../utils/print-job-queue.util";

export class SharedService {
  private sharedReposoitory = new SharedRepository();
  private fileService = new FileService();
  private fileRepository = new FileRepository();

  public async getFullMedicalRecord(
    recordId: string,
    clinicId: string,
  ): Promise<FullMedicalRecordDto> {
    const result = await this.sharedReposoitory.getFullMedicalRecord(recordId);

    if (!result) {
      throw new BaseError(400, "Không tìm thấy bệnh án");
    }
    if (
      result?.medicalRecord.clinicId &&
      result?.medicalRecord.clinicId !== clinicId
    ) {
      throw new BaseError(403, "Bệnh án không thuộc phòng khám");
    }

    return result;
  }

  public async printMedicalRecordDocx(
    recordId: string,
    clinicId: string,
  ): Promise<{ buffer: Buffer; recordCode: string }> {
    const result = await this.getFullMedicalRecord(recordId, clinicId);
    const templateData =
      this.sharedReposoitory.buildMedicalRecordTemplateData(result);
    const recordCode = result.medicalRecord.recordCode ?? recordId;
    const barcodeBuffer = await generateBarcodeBuffer(recordCode);
    templateData.barcode = barcodeBuffer.toString("base64");

    const templatePath = path.resolve(
      process.cwd(),
      "src",
      "templates",
      "medical_record_template.docx",
    );
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const imageModule = new ImageModule({
      centered: true,
      getImage: (tagValue: unknown) => {
        if (!tagValue) {
          return Buffer.alloc(0);
        }
        if (Buffer.isBuffer(tagValue)) {
          return tagValue;
        }
        if (typeof tagValue === "string") {
          return Buffer.from(tagValue, "base64");
        }
        return Buffer.alloc(0);
      },
      getSize: () => [200, 30],
    });
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      modules: [imageModule],
    });

    try {
      doc.render(templateData);
    } catch (error) {
      throw new BaseError(500, "Không thể render template bệnh án");
    }
    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    const pdfBuffer = await convertDocxToPdf(docxBuffer, `${recordCode}.docx`);
    await this.fileService.saveMedicalRecordPdf(
      recordId,
      recordCode,
      pdfBuffer,
    );
    return {
      buffer: pdfBuffer,
      recordCode,
    };
  }

  public async enqueueMedicalRecordPrint(
    recordId: string,
    clinicId: string,
    userId?: string,
  ) {
    await this.getFullMedicalRecord(recordId, clinicId);

    const job = await prisma.printJob.create({
      data: {
        type: PrintJobType.MEDICAL_RECORD,
        status: PrintJobStatus.PENDING,
        entityId: recordId,
        clinicId: clinicId || null,
        userId: userId ?? null,
        payload: { recordId },
      },
    });

    await enqueuePrintJob(job.jobId);

    return {
      jobId: job.jobId,
      status: job.status,
      type: job.type,
    };
  }

  private parseDate(value?: string | Date | null): Date | null {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getLatestRecordChange(dto: FullMedicalRecordDto): Date {
    const times: Date[] = [];
    const push = (value?: string | Date | null) => {
      const date = this.parseDate(value);
      if (date) {
        times.push(date);
      }
    };

    push(dto.medicalRecord.createdAt);
    push(dto.medicalRecord.updatedAt);

    if (dto.patient) {
      push(dto.patient.createdAt);
      push(dto.patient.updatedAt);
    }

    if (dto.clinicalExamination) {
      push(dto.clinicalExamination.examinedAt);
      push(dto.clinicalExamination.updatedAt);
    }

    if (dto.prescription) {
      push(dto.prescription.createdAt);
      push(dto.prescription.updateAt);
      push(dto.prescription.printedAt ?? null);
    }

    for (const request of dto.serviceRequest ?? []) {
      push(request.createdAt);
      for (const detail of request.details ?? []) {
        for (const result of detail.results ?? []) {
          push(result.executedAt ?? null);
          push((result as any).updatedAt ?? null);
        }
      }
    }

    if (times.length === 0) {
      return new Date(0);
    }
    return new Date(Math.max(...times.map((t) => t.getTime())));
  }

  private async getMedicalRecordFileSafe(recordId: string) {
    try {
      return await this.fileService.findByMedicalRecordId(recordId);
    } catch (error) {
      if (error instanceof BaseError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  public async getMedicalRecordFile(recordId: string, clinicId: string) {
    let existing;
    existing = await this.fileRepository.findByMedicalRecordId(recordId);

    if (!existing) {
      await this.printMedicalRecordDocx(recordId, clinicId);
      return await this.getMedicalRecordFileSafe(recordId);
    }

    if (existing?.createdAt) {
      const fullRecord = await this.getFullMedicalRecord(recordId, clinicId);
      const latestChange = this.getLatestRecordChange(fullRecord);

      if (latestChange <= existing.createdAt) {
        return existing;
      }
    }

    await this.printMedicalRecordDocx(recordId, clinicId);

    return await this.getMedicalRecordFileSafe(recordId);
  }
}
