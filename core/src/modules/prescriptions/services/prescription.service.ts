import {
  Prisma,
  PrescriptionStatus,
  PrintJobStatus,
  PrintJobType,
} from "@prisma/client";
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
import { enqueuePrintJob } from "../../../utils/print-job-queue.util";
import { getUtcDayRangeForTimeZone } from "../../../utils/date.util";
import { createPagination } from "../../../utils/pagination.util";

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

        const importPrice = medicine.importPrice
          ? Number(medicine.importPrice)
          : null;

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
          appliedImportPrice: importPrice !== null ? new Prisma.Decimal(importPrice) : null,
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
        record?.createdAt ?? null,
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
      return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
    };

    const formatHyphenLines = (value: unknown) => {
      const text = toStringValue(value).replace(/\r\n/g, "\n").trim();
      if (!text) {
        return "";
      }
      if (text.includes("\n-") || text.startsWith("- ")) {
        return text;
      }
      if (text.includes(" - ")) {
        const parts = text
          .split(" - ")
          .map((part) => part.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          return parts.map((part) => `${part}`).join("\n");
        }
      }
      return text;
    };

    const formatDateLong = (value?: string | Date | null) => {
      if (!value) {
        return "";
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      const parts = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).formatToParts(date);
      const day = parts.find((p) => p.type === "day")?.value ?? "";
      const month = parts.find((p) => p.type === "month")?.value ?? "";
      const year = parts.find((p) => p.type === "year")?.value ?? "";
      if (!day || !month || !year) {
        return "";
      }
      return `Ngày ${day} tháng ${month} năm ${year}`;
    };

    const toBoolString = (value?: boolean | null) => {
      if (value === null || value === undefined) {
        return "";
      }
      return value ? "Có" : "Không";
    };
    const toSessionLabel = (value?: string | null) => {
      switch (value) {
        case "Morning":
          return "sáng";
        case "Noon":
          return "trưa";
        case "Afternoon":
          return "chiều";
        case "Evening":
          return "tối";
        default:
          return "";
      }
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
    const clinicName = formatHyphenLines(rawData.medicalRecord?.clinic?.clinicName);
    const clinicAddress = toStringValue(rawData.medicalRecord?.clinic?.address);
    const clinicPhones = rawData.medicalRecord?.clinic?.phones ?? [];
    const clinicPhonesText =
      clinicPhones.length > 0 ? clinicPhones.join(" - ") : "";
    const doctorName = toStringValue(rawData.medicalRecord?.doctor?.fullName);
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
    const followUpSession = toSessionLabel(
      rawData.medicalRecord?.followUp?.session
        ? String(rawData.medicalRecord.followUp.session)
        : null,
    );
    const reason = toStringValue(rawData.medicalRecord?.followUp?.reason);
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
      followUpSession,
      note,
      reason,
      printCount,
      clinicName,
      clinicAddress,
      clinicPhones,
      clinicPhonesText,
      doctorName,
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

  public async enqueuePrescriptionPrint(
    prescriptionId: string,
    clinicId?: string,
    userId?: string,
  ) {
    const existing = await prisma.prescription.findUnique({
      where: { prescriptionId },
      select: {
        status: true,
        medicalRecord: { select: { clinicId: true } },
      },
    });

    if (!existing) {
      throw new BaseError(404, "Không tìm thấy toa để in");
    }

    if (clinicId && existing.medicalRecord?.clinicId !== clinicId) {
      throw new BaseError(403, "Không có quyền truy cập toa thuốc");
    }

    if ((existing.status === PrescriptionStatus.Issued)) {
      const nowFile =
        await this.fileService.findByPrescriptionId(prescriptionId);
      if (nowFile) {
        return { nowFile, enqueued: false };
      }
    }

    const job = await prisma.printJob.create({
      data: {
        type: PrintJobType.PRESCRIPTION,
        status: PrintJobStatus.PENDING,
        entityId: prescriptionId,
        clinicId: clinicId || null,
        userId: userId ?? null,
        payload: { prescriptionId },
      },
    });

    await enqueuePrintJob(job.jobId);

    return {
      jobId: job.jobId,
      status: job.status,
      type: job.type,
      enqueued: true,
    };
  }

  public async updateStatusToDraft(prescriptionId: string, clinicId?: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { prescriptionId },
      select: {
        status: true,
        isDispensed: true,
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

    if (prescription.isDispensed) {
      throw new BaseError(400, "Toa thuốc đã xuất, không thể mở lại")
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
      isDispensed: pres.isDispensed ?? false,
      dispensedAt: pres.dispensedAt ?? null,
      details: (pres.details ?? []).map((d) => {
        const unitPrice =
          d.appliedExportPrice !== null && d.appliedExportPrice !== undefined
            ? Number(d.appliedExportPrice)
            : d.medicine?.sellPrice !== null &&
                d.medicine?.sellPrice !== undefined
              ? Number(d.medicine.sellPrice)
              : null;
        const quantity = d.quantity ? Number(d.quantity) : 0;
        const total = unitPrice !== null ? unitPrice * quantity : 0;

        return {
          medicineId: d.medicineId ?? "",
          medicineName: d.medicine?.medicineName ?? "",
          sellPrice: unitPrice,
          frequencyPerDay: d.frequencyPerDay ?? 0,
          quantityPerTime: d.quantityPerTime ? Number(d.quantityPerTime) : 0,
          quantity,
          unit: d.unit ?? "",
          administrationRoute: d.administrationRoute ?? undefined,
          timing: d.timing ?? "",
          daysToTake: d.daysToTake ?? 0,
          note: d.note ?? null,
          isInsuranceCovered: d.isInsuranceCovered ?? false,
          total,
        };
      }),
    }));
  }

  public async getPatientsWithPrescriptionsByDate(
    from: string | undefined,
    to: string | undefined,
    isDispensed: boolean | undefined,
    fullName: string | undefined,
    page: number = 1,
    size: number = 10,
    clinicId?: string,
  ) {
    const timeZone = "Asia/Ho_Chi_Minh";
    const toParts = (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      return { year, month, day };
    };

    let startUtc: Date;
    let endUtc: Date;

    if (from) {
      const fromParts = toParts(from);
      startUtc = getUtcDayRangeForTimeZone(fromParts, timeZone).startUtc;

      if (to) {
        const toPartsValue = toParts(to);
        endUtc = getUtcDayRangeForTimeZone(toPartsValue, timeZone).endUtc;
      } else {
        endUtc = getUtcDayRangeForTimeZone(new Date(), timeZone).endUtc;
      }
    } else if (to) {
      const todayRange = getUtcDayRangeForTimeZone(new Date(), timeZone);
      startUtc = todayRange.startUtc;
      endUtc = todayRange.endUtc;
    } else {
      const todayRange = getUtcDayRangeForTimeZone(new Date(), timeZone);
      startUtc = todayRange.startUtc;
      endUtc = todayRange.endUtc;
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeSize = Math.max(Number(size) || 10, 1);

    const { items, totalItems } =
      await this.prescriptionRepository.findPatientsWithPrescriptionsByDate({
        from: startUtc,
        to: endUtc,
        clinicId,
        page: safePage,
        size: safeSize,
        isDispensed,
        fullName: fullName?.trim() || undefined,
      });

    const data = items.map((pres) => ({
      patient: {
        patientId: pres.medicalRecord?.patient?.patientId ?? "",
        patientCode: pres.medicalRecord?.patient?.patientCode ?? "",
        fullName: pres.medicalRecord?.patient?.fullName ?? "",
        gender: pres.medicalRecord?.patient?.gender ?? null,
        dob: pres.medicalRecord?.patient?.dob
          ? pres.medicalRecord?.patient?.dob.toISOString()
          : "",
        phone: pres.medicalRecord?.patient?.phone ?? "",
      },
      medicalRecord: {
        recordId: pres.medicalRecord?.recordId ?? "",
        recordCode: pres.medicalRecord?.recordCode ?? "",
        createdAt: pres.medicalRecord?.createdAt
          ? pres.medicalRecord?.createdAt.toISOString()
          : "",
        consultationFee: Number(pres.medicalRecord?.consultationFee) ?? 0,
      },
      prescription: {
        prescriptionId: pres.prescriptionId,
        prescriptionCode: pres.prescriptionCode ?? "",
        status: pres.status,
        note: pres.note ?? "",
        totalPrice: pres.totalPrice ? Number(pres.totalPrice) : 0,
        createdAt: pres.createdAt ? pres.createdAt.toISOString() : "",
        printedAt: pres.printedAt ? pres.printedAt.toISOString() : "",
        isDispensed: pres.isDispensed ?? false,
        dispensedAt: pres.dispensedAt ? pres.dispensedAt.toISOString() : "",
        details: (pres.details ?? []).map((d) => {
          const unitPrice =
            d.appliedExportPrice !== null && d.appliedExportPrice !== undefined
              ? Number(d.appliedExportPrice)
              : d.medicine?.sellPrice !== null &&
                  d.medicine?.sellPrice !== undefined
                ? Number(d.medicine.sellPrice)
                : null;
          const quantity = d.quantity ? Number(d.quantity) : 0;
          const total = unitPrice !== null ? unitPrice * quantity : 0;

          return {
            medicineId: d.medicineId ?? "",
            medicineName: d.medicine?.medicineName ?? "",
            sellPrice: unitPrice,
            frequencyPerDay: d.frequencyPerDay ?? 0,
            quantityPerTime: d.quantityPerTime ? Number(d.quantityPerTime) : 0,
            quantity,
            unit: d.unit ?? "",
            administrationRoute: d.administrationRoute ?? undefined,
            timing: d.timing ?? "",
            daysToTake: d.daysToTake ?? 0,
            note: d.note ?? null,
            isInsuranceCovered: d.isInsuranceCovered ?? false,
            total,
          };
        }),
      },
    }));

    return {
      items: data,
      pagination: createPagination(safePage, safeSize, totalItems),
    };
  }

  public async dispensePrescription(
    prescriptionId: string,
    userId: string,
    forceExport: boolean = false,
    clinicId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const data = await this.prescriptionRepository.getDispenseData(
        prescriptionId,
        tx,
      );

      if (!data) {
        throw new BaseError(404, "Không tìm thấy toa thuốc.");
      }

      if (clinicId && data.medicalRecord?.clinicId !== clinicId) {
        throw new BaseError(403, "Không có quyền truy cập toa thuốc.");
      }

      const dispenseDetails = data.details.filter((d) => !d.medicine?.deletedAt);
      if (dispenseDetails.length !== data.details.length) {
        const deletedMedicineIds = data.details
          .filter((d) => d.medicine?.deletedAt)
          .map((d) => d.medicineId ?? "")
          .filter(Boolean);

        await tx.prescriptionDetail.deleteMany({
          where: {
            prescriptionId,
            medicineId: { in: deletedMedicineIds },
          },
        });
      }

      if (data.status !== PrescriptionStatus.Issued) {
        throw new BaseError(400, "Chỉ được xuất khi toa đã in (Issued)");
      }

      if (data.isDispensed) {
        throw new BaseError(400, "Toa thuốc đã được xuất.");
      }

      if (!forceExport) {
        const insufficientMedicines: Array<{
          medicineId: string;
          medicineName: string;
          required: number;
          available: number;
          shortage: number;
        }> = [];
        for (const detail of dispenseDetails) {
          const required = Math.round(Number(detail.quantity));
          const available = detail.medicine?.totalQuantity ?? 0;
          const shortage = Math.max(0, required - available);
          if (required > available) {
            insufficientMedicines.push({
              medicineId: detail.medicineId ?? "",
              medicineName: detail.medicine?.medicineName ?? "",
              required,
              available,
              shortage,
            });
          }
        }

        if (insufficientMedicines.length > 0) {
          throw new BaseError(409, "Không đủ thuốc để xuất.", {
            items: insufficientMedicines,
          });
        }
      }

      for (const detail of dispenseDetails) {
        const required = Math.round(Number(detail.quantity ?? 0));
        if (!detail.medicineId || required <= 0) continue;

        if (!forceExport) {
          const updated = await this.medicineRepository.decrementStockIfEnough(
            detail.medicineId,
            required,
            tx,
          );
          if (updated.count === 0) {
            throw new BaseError(409, "Thuốc trong kho không đủ để xuất.", {
              items: [
                {
                  medicineId: detail.medicineId,
                  medicineName: detail.medicine?.medicineName,
                  required,
                  available: detail.medicine?.totalQuantity ?? 0,
                  shortage: required - (detail.medicine?.totalQuantity ?? 0),
                },
              ],
            });
          }
        } else {
          const available = detail.medicine?.totalQuantity ?? 0;
          if (available >= required) {
            await this.medicineRepository.decrementStockForce(
              detail.medicineId,
              required,
              tx,
            );
          } else {
            await this.medicineRepository.setStockToZero(detail.medicineId, tx);
          }
        }
      }

      let totalPrice = 0;
      for (const d of dispenseDetails) {
        const qty = Number(d.quantity ?? 0);
        const unitPrice =
          d.appliedExportPrice !== null && d.appliedExportPrice !== undefined
            ? Number(d.appliedExportPrice)
            : d.medicine?.sellPrice
              ? Number(d.medicine.sellPrice)
              : 0;
        totalPrice += unitPrice * qty;
      }

      await this.prescriptionRepository.markDispensed(
        prescriptionId,
        userId,
        totalPrice,
        tx,
      );

      await this.prescriptionRepository.createInventoryLogs(
        dispenseDetails.map((d) => {
          const required = Math.round(Number(d.quantity ?? 0));
          const available = d.medicine?.totalQuantity ?? 0;
          return {
            medicineId: d.medicineId ?? null,
            type: "Export",
            quantity: required,
            shortage: required > available ? required - available : 0,
            unitPrice:
              d.appliedExportPrice !== null &&
              d.appliedExportPrice !== undefined
                ? new Prisma.Decimal(d.appliedExportPrice)
                : (d.medicine?.sellPrice ?? null),
            totalPrice: d.totalPrice ?? null,
            performedBy: userId,
            prescriptionId,
          };
        }),
        tx,
      );

      return { prescriptionId, totalPrice };
    });
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
