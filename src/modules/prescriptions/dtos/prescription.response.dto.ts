import { PrescriptionItemDto } from "./prescription.request.dto"
import { PrescriptionStatus } from "@prisma/client"

export interface PrescriptionDetailResponseDto {
    prescriptionId: string;
    pdfPath: string;
    fileName: string;
    note: string;
    totalPrice: number;
    status: PrescriptionStatus;
    createdAt: Date;
    updateAt: Date;
    details: PrescriptionItemDto[];
}