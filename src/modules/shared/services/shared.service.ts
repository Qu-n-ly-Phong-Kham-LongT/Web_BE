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

export class SharedService {
  private sharedReposoitory = new SharedRepository();
  private fileService = new FileService();

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

  public async getMedicalRecordFile(recordId: string) {
    
  }
}
