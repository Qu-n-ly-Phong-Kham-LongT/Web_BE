import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { BaseError } from "../../../utils/base-error.util";
import { FullMedicalRecordDto } from "../dtos/medical-record-detail.dto";
import { SharedRepository } from "../repositories/shared.repository";

export class SharedService {
    private sharedReposoitory = new SharedRepository();

    public async getFullMedicalRecord(recordId: string, clinicId: string): Promise<FullMedicalRecordDto> {
        const result = await this.sharedReposoitory.getFullMedicalRecord(recordId);

        if (!result) {
            throw new BaseError(400, "Khong tim thay benh an");
        }
        if (result?.medicalRecord.clinicId && result?.medicalRecord.clinicId !== clinicId) {
            throw new BaseError(403, "Bệnh án không thuộc phòng khám")
        }

        return result;
    }

    public async printMedicalRecordDocx(
        recordId: string,
        clinicId: string
    ): Promise<{ buffer: Buffer; recordCode: string }> {
        const result = await this.getFullMedicalRecord(recordId, clinicId);
        const templateData = this.sharedReposoitory.buildMedicalRecordTemplateData(result);

        const templatePath = path.resolve(
            process.cwd(),
            "src",
            "templates",
            "medical_record_template.docx"
        );
        const content = fs.readFileSync(templatePath);
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "{{", end: "}}" },
        });

        try {
            doc.render(templateData);
        } catch (error) {
            throw new BaseError(500, "Khong the render template benh an");
        }
        const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
        return {
            buffer: docxBuffer,
            recordCode: result.medicalRecord.recordCode ?? recordId,
        };
    }
}
