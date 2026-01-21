import { PrescriptionItemDto } from "./prescription.request.dto"
import { PrescriptionStatus } from "@prisma/client"

export interface PrescriptionDetailResponseDto {
    prescriptionId: string;
    note: string;
    totalPrice: number;
    status: PrescriptionStatus;
    createdAt: Date;
    updateAt: Date;
    printedAt?: Date | null;
    printCount?: number;
    details: PrescriptionItemDto[];
}

export interface PrescriptionStatusResponseDto {
    statuses: PrescriptionStatus[];
}
