import { Prisma } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { prisma } from "../../../config/database.config";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { UpsertDianosisPrescriptionDto } from "../dtos/prescription.request.dto";
import { PrescriptionRepository } from "../repositories/prescription.repository";
import { generateBarcodeBuffer } from "../../../utils/barcode.util";
import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import fs from "fs";
import path from "path";
import { convertDocxToPdf } from "../../../utils/docx-to-pdf.util";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import { FileService } from "../../file/services/file.service";

export class PrecriptionService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private prescriptionRepository = new PrescriptionRepository();
  private medicineRepository = new MedicineRepository();
  private fileService = new FileService();

  public async upsertPrecriptionDiagnosis(
    payload: UpsertDianosisPrescriptionDto,
    clinicId: string
  ) {
    const record = await this.medicalRecordRepository.findById(
      payload.recordId
    );
    if (!record || record.clinicId !== clinicId) {
      throw new BaseError(403, "Bạn không có quyền truy cập bệnh án này");
    }

    return await prisma.$transaction(async (tx) => {
      const updateRecordData: Prisma.MedicalRecordUpdateInput = {};

      if (payload.evidenceBasedDiagnosis !== undefined) {
        updateRecordData.evidenceBasedDiagnosis =
          payload.evidenceBasedDiagnosis;
      }
      if (payload.diagnoses !== undefined) {
        updateRecordData.diagnoses = payload.diagnoses
          ? (payload.diagnoses as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull;
      }
      if (payload.doctorAdvice !== undefined) {
        updateRecordData.doctorAdvice = payload.doctorAdvice;
      }
      if (payload.treatmentNote !== undefined) {
        updateRecordData.treatmentNote = payload.treatmentNote;
      }

      if (Object.keys(updateRecordData).length > 0) {
        await tx.medicalRecord.update({
          where: { recordId: payload.recordId },
          data: updateRecordData,
        });
      }

      if (payload.followUp) {
        let appointmentDate: Date | null = null;
        if (payload.followUp.appointmentDate) {
          const parsed = new Date(payload.followUp.appointmentDate);
          if (Number.isNaN(parsed.getTime())) {
            throw new BaseError(400, "Ngày hẹn không hợp lệ");
          }
          appointmentDate = parsed;
        }

        await tx.followUp.upsert({
          where: { recordId: payload.recordId },
          update: {
            appointmentDate,
            session: payload.followUp.session,
            reason: payload.followUp.reason ?? null,
          },
          create: {
            recordId: payload.recordId,
            appointmentDate,
            session: payload.followUp.session,
            reason: payload.followUp.reason ?? null,
          },
        });
      }

      if (payload.prescriptionItems === undefined) {
        return null;
      }

      const items = payload.prescriptionItems ?? [];
      const medicineIds = items.map((i) => i.medicineId);
      const uniqueMedicineIds = [...new Set(medicineIds)];

      if (uniqueMedicineIds.length !== medicineIds.length) {
        throw new BaseError(400, "Không được trùng thuốc trong cùng một toa");
      }

      const medicines =
        uniqueMedicineIds.length > 0
          ? await this.medicineRepository.findMedicinesByIds(
              uniqueMedicineIds,
              tx
            )
          : [];

      if (medicines.length !== uniqueMedicineIds.length) {
        const found = new Set(medicines.map((m) => m.medicineId));
        const missing = uniqueMedicineIds.filter((id) => !found.has(id));
        throw new BaseError(400, `Thuốc không tồn tại: ${missing.join(", ")}`);
      }

      const medicineMap = new Map(medicines.map((m) => [m.medicineId, m]));
      const detailsToCreate: Prisma.PrescriptionDetailUncheckedCreateInput[] =
        [];
      let totalPrice = 0;

      for (const item of items) {
        const medicine = medicineMap.get(item.medicineId);
        if (!medicine) {
          throw new BaseError(400, "Thuốc không hợp lệ");
        }

        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new BaseError(400, "Số lượng thuốc không hợp lệ");
        }

        let appliedPrice = medicine.sellPrice ? Number(medicine.sellPrice) : 0;
        if (item.isInsuranceCovered) {
          if (!medicine.isInsuranceCovered) {
            throw new BaseError(400, "Thuốc này không được BHYT hỗ trợ");
          }
          if (!medicine.insurancePrice) {
            throw new BaseError(400, "Thuốc này chưa có giá BHYT");
          }
          appliedPrice = Number(medicine.insurancePrice);
        }
        const lineTotal = appliedPrice * quantity;
        totalPrice += lineTotal;

        detailsToCreate.push({
          prescriptionId: "",
          medicineId: item.medicineId,
          unit: item.unit,
          frequencyPerDay: item.frequencyPerDay,
          quantityPerTime: item.quantityPerTime,
          administrationRoute: item.administrationRoute ?? null,
          timing: item.timing,
          quantity: quantity,
          daysToTake: item.daysToTake,
          isInsuranceCovered: item.isInsuranceCovered ?? false,
          appliedExportPrice: new Prisma.Decimal(appliedPrice),
          totalPrice: new Prisma.Decimal(lineTotal),
          note: item.note ?? null,
        });
      }

      const prescriptionNote =
        payload.treatmentNote ?? payload.doctorAdvice ?? null;

      const prescription = await this.prescriptionRepository.upsertPrescription(
        payload.recordId,
        totalPrice,
        prescriptionNote,
        tx
      );

      await tx.prescriptionDetail.deleteMany({
        where: { prescriptionId: prescription.prescriptionId },
      });

      if (detailsToCreate.length > 0) {
        await tx.prescriptionDetail.createMany({
          data: detailsToCreate.map((detail) => ({
            ...detail,
            prescriptionId: prescription.prescriptionId,
          })),
        });
      }

      return prescription;
    });
  }

  public async prepareForTemplate(prescriptionId: string, clinicId?: string) {
    const rawData =
      await this.prescriptionRepository.getPrintData(prescriptionId);

    if (!rawData) {
      throw new BaseError(404, "Không tìm thấy toa thuốc để in");
    }
    if (
      rawData?.medicalRecord?.clinicId &&
      rawData.medicalRecord.clinicId !== clinicId
    ) {
      throw new BaseError(404, "Không có quyền truy cập bệnh án");
    }

    const toStringValue = (value: unknown) =>
      value === null || value === undefined ? "" : String(value);
    const formatDate = (value?: string | Date | null) => {
      if (!value) {
        return "";
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("vi-VN");
    };
    const formatDateLong = (value?: string | Date | null) => {
      if (!value) {
        return "";
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `Ngày ${day} tháng ${month} năm ${year}`;
    };

    const toBoolString = (value?: boolean | null) => {
      if (value === null || value === undefined) {
        return "";
      }
      return value ? "Có" : "Không";
    };

    const prescriptionCode = toStringValue(rawData.prescriptionCode);
    const barcode = await generateBarcodeBuffer(prescriptionCode);

    const fullName = toStringValue(rawData.medicalRecord?.patient?.fullName);
    const dob = formatDate(rawData.medicalRecord?.patient?.dob);
    const gender =
      rawData.medicalRecord?.patient?.gender === "Male"
        ? "Nam"
        : rawData.medicalRecord?.patient?.gender === "Female"
          ? "Nữ"
          : rawData.medicalRecord?.patient?.gender === "Other"
            ? "Khác"
            : "";
    const address = toStringValue(rawData.medicalRecord?.patient?.address);
    const phone = toStringValue(rawData.medicalRecord?.patient?.phone);

    const diagnoses = rawData.medicalRecord
      ?.diagnoses as unknown as MedicalDiagnosisDto;

    const diagnosisMainCode = toStringValue(diagnoses?.main?.code);
    const diagnosisMainDescription = toStringValue(
      diagnoses?.main?.description
    );
    const diagnosisSecondary = diagnoses?.secondary ?? [];
    const createDate = formatDateLong(rawData.createdAt);
    const note = toStringValue(rawData.note);
    const prescriptionDetails = (rawData.details ?? []).map((detail) => ({
      medicineId: toStringValue(detail.medicineId),
      medicineName: toStringValue(detail.medicine?.medicineName),
      frequencyPerDay: toStringValue(detail.frequencyPerDay),
      quantityPerTime: toStringValue(detail.quantityPerTime),
      quantity: toStringValue(detail.quantity),
      unit: toStringValue(detail.unit),
      administrationRoute: toStringValue(detail.administrationRoute),
      timing: toStringValue(detail.timing),
      daysToTake: toStringValue(detail.daysToTake),
      note: toStringValue(detail.note),
      isInsuranceCovered: toBoolString(detail.medicine?.isInsuranceCovered),
    }));

    const medicines = prescriptionDetails.map((detail, index) => {
      const usageParts: string[] = [];
      if (detail.frequencyPerDay) {
        usageParts.push(`Ngày uống: ${detail.frequencyPerDay} lần`);
      }
      if (detail.quantityPerTime) {
        usageParts.push(`Mỗi lần: ${detail.quantityPerTime} ${detail.unit}`);
      }
      if (detail.timing) {
        usageParts.push(`${detail.timing}`);
      }

      return {
        index: index + 1,
        medicineId: detail.medicineId,
        medicineName: detail.medicineName,
        quantity: detail.quantity,
        unit: detail.unit,
        usage: usageParts.join(", "),
      };
    });

    const followUpDate = formatDate(rawData.medicalRecord?.followUp?.appointmentDate);
    return {
      prescriptionCode,
      barcode,
      fullName,
      dob,
      address,
      phone,
      gender,
      diagnosisMainDescription,
      diagnosisMainCode,
      diagnosisSecondary,
      medicines,
      createDate,
      followUpDate,
      note,
    };
  }

  public async printServiceRequestDocx(
    prescriptionId: string,
    clinicId?: string
  ): Promise<{ buffer: Buffer; prescriptionCode: string }> {
    const templateData = await this.prepareForTemplate(
      prescriptionId,
      clinicId
    );
    const prescriptionCode = templateData.prescriptionCode || prescriptionId;
    const barcodeBase64 = templateData.barcode.toString("base64");
    const templatePath = path.resolve(
      process.cwd(),
      "src",
      "templates",
      "prescription_template.docx"
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
      doc.render({
        ...templateData,
        barcode: barcodeBase64,
      });
    } catch (error) {
      throw new BaseError(500, "Không thể render data của toa thuốc");
    }

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    return {
      buffer: docxBuffer,
      prescriptionCode,
    };
  }

  public async printServiceRequestPdf(
    prescriptionId: string,
    clinicId?: string
  ): Promise<{
    prescriptionCode: string;
    file: {
      fileId: string;
      relativePath: string;
      url: string;
      type: string;
      size: number;
      createdAt: Date;
    };
  }> {
    const docxResult = await this.printServiceRequestDocx(
      prescriptionId,
      clinicId
    );
    const pdfBuffer = await convertDocxToPdf(
      docxResult.buffer,
      `${docxResult.prescriptionCode}.docx`
    );
    const file = await this.fileService.saveServiceRequestPdf(
      prescriptionId,
      docxResult.prescriptionCode,
      pdfBuffer
    );

    return {
      prescriptionCode: docxResult.prescriptionCode,
      file,
    };
  }
}
