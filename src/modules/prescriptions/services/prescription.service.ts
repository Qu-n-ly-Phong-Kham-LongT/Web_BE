import { Prisma, PrescriptionStatus } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { prisma } from "../../../config/database.config";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { UpsertDianosisPrescriptionDto } from "../dtos/prescription.request.dto";
import { PrescriptionStatusResponseDto } from "../dtos/prescription.response.dto";
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
import { PatientRepository } from "../../patient/repositories/patient.repository";

export class PrecriptionService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private prescriptionRepository = new PrescriptionRepository();
  private medicineRepository = new MedicineRepository();
  private patientRepository = new PatientRepository();
  private fileService = new FileService();

  public async upsertPrecriptionDiagnosis(
    payload: UpsertDianosisPrescriptionDto,
    clinicId: string,
  ) {
    const record = await this.medicalRecordRepository.findById(
      payload.recordId,
    );
    if (!record || record.clinicId !== clinicId) {
      throw new BaseError(403, "Bạn không có quyền truy cập bệnh án này");
    }

    return await prisma.$transaction(async (tx) => {
      const existingPrescription = await tx.prescription.findUnique({
        where: { recordId: payload.recordId },
        select: { status: true },
      });
      if (
        existingPrescription &&
        existingPrescription.status !== PrescriptionStatus.Draft
      ) {
        throw new BaseError(
          400,
          "Toa thuốc đã in hoặc bị khóa, không thể cập nhật",
        );
      }

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
              tx,
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
        tx,
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

  public async getPrescriptionStatus(): Promise<PrescriptionStatusResponseDto> {
    return { statuses: Object.values(PrescriptionStatus) };
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
      diagnoses?.main?.description,
    );
    const diagnosisSecondary = diagnoses?.secondary ?? [];
    const createDate = formatDateLong(rawData.createdAt);
    const note = toStringValue(rawData.note);
    const printCount = rawData.printCount;
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
      prepNote: toStringValue(detail.note),
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

      let prepNote = "";
      if (detail.prepNote && detail.prepNote.length > 0) {
        prepNote = toStringValue(", Ghi chú: " + detail.prepNote);
      }

      return {
        index: index + 1,
        medicineId: detail.medicineId,
        medicineName: detail.medicineName,
        quantity: detail.quantity,
        unit: detail.unit,
        usage: usageParts.join(", "),
        prepNote,
      };
    });

    const followUpDate = formatDate(
      rawData.medicalRecord?.followUp?.appointmentDate,
    );
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
      printCount,
    };
  }

  public async printPrescriptionPdf(
    prescriptionId: string,
    clinicId?: string,
  ): Promise<{ buffer: Buffer; prescriptionCode: string }> {
    const existing = await prisma.prescription.findUnique({
      where: { prescriptionId },
      select: { status: true, printCount: true },
    });

    if (!existing) {
      throw new BaseError(404, "Không tìm thấy toa thuốc để in");
    }

    if (existing.status !== PrescriptionStatus.Draft) {
      throw new BaseError(400, "Toa thuốc đã in, không được in lại");
    }

    const templateData = await this.prepareForTemplate(
      prescriptionId,
      clinicId,
    );
    const prescriptionCode = templateData.prescriptionCode || prescriptionId;
    const barcodeBase64 = templateData.barcode.toString("base64");
    const templatePath = path.resolve(
      process.cwd(),
      "src",
      "templates",
      "prescription_template.docx",
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
    const pdfBuffer = await convertDocxToPdf(
      docxBuffer,
      `${prescriptionCode}.docx`,
    );
    await this.fileService.savePrescripitonPdf(
      prescriptionId,
      prescriptionCode,
      pdfBuffer,
    );
    await prisma.prescription.update({
      where: { prescriptionId },
      data: {
        status: PrescriptionStatus.Issued,
        printedAt: new Date(),
        printCount: (existing.printCount ?? 0) + 1,
      },
    });
    return {
      buffer: pdfBuffer,
      prescriptionCode,
    };
  }

  public async updateStatusToDraft(prescriptionId: string, clinicId?: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { prescriptionId },
      select: {
        status: true,
        medicalRecord: { select: { clinicId: true } },
      },
    });

    if (!prescription) {
      throw new BaseError(404, "Không tìm thấy toa thuốc");
    }

    if (clinicId && prescription.medicalRecord?.clinicId !== clinicId) {
      throw new BaseError(403, "Không có quyền truy cập toa thuốc");
    }

    if (prescription.status === PrescriptionStatus.Cancelled) {
      throw new BaseError(400, "Toa thuốc đã hủy, không thể mở lại");
    }

    return await prisma.prescription.update({
      where: { prescriptionId },
      data: { status: PrescriptionStatus.Draft },
    });
  }

  public async getPrescriptionsByPatientId(
    patientId: string,
    clinicId?: string,
    search?: string,
    status?: PrescriptionStatus,
    sort?: string,
  ) {
    const patient = await this.patientRepository.findPatientById(
      patientId,
      clinicId,
    );

    if (!patient) {
      throw new BaseError(404, "Không tìm thấy bệnh nhân");
    }

    const parseSafeDate = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) {
        return d;
      }
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
      if (!match) {
        return undefined;
      }
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      const parsed = new Date(year, month - 1, day);
      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        return undefined;
      }
      return parsed;
    };

    const normalizedSearch = search?.trim().toLowerCase();
    const parsed = parseSafeDate(search);

    const from = parsed
      ? new Date(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
          0,
          0,
          0,
          0,
        )
      : undefined;
    const to = parsed
      ? new Date(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
          23,
          59,
          59,
          999,
        )
      : undefined;

    const sortOrder = sort?.toLowerCase() === "asc" ? "asc" : "desc";
    const data = await this.prescriptionRepository.findByPatientId({
      patientId,
      clinicId,
      fromDate: from,
      toDate: to,
      status,
      sort: sortOrder,
    });

    const filteredData =
      normalizedSearch && !parsed
        ? data.filter((pres) => {
            const diagnoses = pres.medicalRecord?.diagnoses as {
              main?: { code?: string; description?: string };
            } | null;
            const code = diagnoses?.main?.code?.toLowerCase();
            const description = diagnoses?.main?.description?.toLowerCase();
            return (
              (code && code.includes(normalizedSearch)) ||
              (description && description.includes(normalizedSearch))
            );
          })
        : data;

    return filteredData.map((pres) => ({
      recordId: pres.medicalRecord?.recordId ?? "",
      recordCode: pres.medicalRecord?.recordCode ?? "",
      recordCreatedAt: pres.medicalRecord?.createdAt ?? null,
      prescriptionId: pres.prescriptionId,
      prescriptionCode: pres.prescriptionCode,
      status: pres.status,
      createdAt: pres.createdAt ?? null,
      printedAt: pres.printedAt ?? null,
      details: (pres.details ?? []).map((d) => ({
        medicineId: d.medicineId ?? "",
        medicineName: d.medicine?.medicineName ?? "",
        sellPrice:
          d.appliedExportPrice !== null && d.appliedExportPrice !== undefined
            ? Number(d.appliedExportPrice)
            : d.medicine?.sellPrice !== null && d.medicine?.sellPrice !== undefined
              ? Number(d.medicine.sellPrice)
              : null,
        frequencyPerDay: d.frequencyPerDay ?? 0,
        quantityPerTime: d.quantityPerTime ? Number(d.quantityPerTime) : 0,
        quantity: d.quantity ? Number(d.quantity) : 0,
        unit: d.unit ?? "",
        timing: d.timing ?? "",
        daysToTake: d.daysToTake ?? 0,
        note: d.note ?? null,
        isInsuranceCovered: d.isInsuranceCovered ?? false,
      })),
    }));
  }

  // public async printPresctiptionPdf(
  //   prescriptionId: string,
  //   clinicId?: string
  // ): Promise<{
  //   prescriptionCode: string;
  //   file: {
  //     fileId: string;
  //     relativePath: string;
  //     url: string;
  //     type: string;
  //     size: number;
  //     createdAt: Date;
  //   };
  // }> {
  //   const docxResult = await this.printPrescriptionDocx(
  //     prescriptionId,
  //     clinicId
  //   );
  //   const pdfBuffer = await convertDocxToPdf(
  //     docxResult.buffer,
  //     `${docxResult.prescriptionCode}.docx`
  //   );
  //   const file = await this.fileService.savePrescripitonPdf(
  //     prescriptionId,
  //     docxResult.prescriptionCode,
  //     pdfBuffer
  //   );

  //   return {
  //     pres,
  //     prescriptionCodeCode,
  //   };
  // }
}
