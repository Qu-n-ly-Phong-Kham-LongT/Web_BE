import { PrescriptionStatus } from "@prisma/client";

export interface PrescriptionDetailItemResponseDto {
  medicineId: string;
  medicineName?: string | null;
  sellPrice?: number | null;
  frequencyPerDay: number;
  quantityPerTime: number;
  quantity: number;
  unit: string;
  administrationRoute?: string;
  timing: string;
  daysToTake: number;
  note?: string | null;
  isInsuranceCovered: boolean;
  total: number;
}

export interface PrescriptionDetailResponseDto {
  prescriptionId: string;
  note: string;
  totalPrice: number;
  status: PrescriptionStatus;
  createdAt: Date;
  updateAt: Date;
  printedAt?: Date | null;
  printCount?: number;
  isDispensed?: boolean;
  dispensedAt?: Date | null;
  details: PrescriptionDetailItemResponseDto[];
}

export interface PrescriptionStatusResponseDto {
  statuses: PrescriptionStatus[];
}
