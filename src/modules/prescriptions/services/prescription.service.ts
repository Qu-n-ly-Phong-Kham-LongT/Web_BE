import { Prisma } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { prisma } from "../../../config/database.config";
import { MedicalRecordRepository } from "../../medical-record/repositories/medical-record.repository";
import { MedicineRepository } from "../../medicine/repositories/medicine.repository";
import { UpsertDianosisPrescriptionDto } from "../dtos/prescription.request.dto";
import { PrescriptionRepository } from "../repositories/prescription.repository";

export class PrecriptionService {
  private medicalRecordRepository = new MedicalRecordRepository();
  private prescriptionRepository = new PrescriptionRepository();
  private medicineRepository = new MedicineRepository();

  public async upsertPrecriptionDiagnosis(
    payload: UpsertDianosisPrescriptionDto,
    clinicId: string
  ) {
    const record = await this.medicalRecordRepository.findById(payload.recordId);
    if (!record || record.clinicId !== clinicId) {
      throw new BaseError(403, "Bạn không có quyền truy cập bệnh án này");
    }

    return await prisma.$transaction(async (tx) => {
      const updateRecordData: Prisma.MedicalRecordUpdateInput = {};

      if (payload.evidenceBasedDiagnosis !== undefined) {
        updateRecordData.evidenceBasedDiagnosis = payload.evidenceBasedDiagnosis;
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
          ? await this.medicineRepository.findMedicinesByIds(uniqueMedicineIds, tx)
          : [];

      if (medicines.length !== uniqueMedicineIds.length) {
        const found = new Set(medicines.map((m) => m.medicineId));
        const missing = uniqueMedicineIds.filter((id) => !found.has(id));
        throw new BaseError(400, `Thuốc không tồn tại: ${missing.join(", ")}`);
      }

      const medicineMap = new Map(medicines.map((m) => [m.medicineId, m]));
      const detailsToCreate: Prisma.PrescriptionDetailUncheckedCreateInput[] = [];
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

        const appliedPrice = medicine.sellPrice ? Number(medicine.sellPrice) : 0;
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

      const prescriptionNote = payload.treatmentNote ?? payload.doctorAdvice ?? null;

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
}
