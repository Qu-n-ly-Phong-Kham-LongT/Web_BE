import { Session } from "@prisma/client";

export interface FollowUpResponseDto {
  appointmentDate?: Date | null;
  session?: Session | null;
  reason?: string | null;
}

export interface FollowUpPrescriptionMedicineResponseDto {
  medicineId: string | null;
  medicineName: string | null;
  activeIngredient: string | null;
}

export interface FollowUpPrescriptionDetailResponseDto {
  detailId: string;
  unit: string | null;
  quantity: number | null;
  frequencyPerDay: number | null;
  quantityPerTime: number | null;
  daysToTake: number | null;
  administrationRoute: string | null;
  timing: string | null;
  note: string | null;
  medicine: FollowUpPrescriptionMedicineResponseDto | null;
}

export interface FollowUpPrescriptionResponseDto {
  prescriptionId: string;
  prescriptionCode: string | null;
  status: string | null;
  totalPrice: number | null;
  isDispensed: boolean | null;
  details: FollowUpPrescriptionDetailResponseDto[];
}

export interface FollowUpServiceItemResponseDto {
  itemId: string;
  itemCode: string | null;
  name: string | null;
  basePrice: number | null;
  unit: string | null;
  specimen: string | null;
}

export interface FollowUpServiceRequestDetailResponseDto {
  requestDetailId: string;
  selectedOptions: unknown;
  serviceItem: FollowUpServiceItemResponseDto | null;
}

export interface FollowUpServiceRequestResponseDto {
  requestId: string;
  requestCode: string | null;
  diagnoses: unknown;
  diagnosisNote: string | null;
  isFollowUpTransferred: boolean;
  followUpDate: string | null;
  followUpSession: Session | null;
  note: string | null;
  details: FollowUpServiceRequestDetailResponseDto[];
}

export interface FollowUpPatientResponseDto {
  patientId: string;
  patientCode: string | null;
  fullName: string | null;
  gender: string | null;
  dob: string | null;
  phone: string | null;
  email: string | null;
}

export interface FollowUpMedicalRecordResponseDto {
  recordId: string;
  recordCode: string | null;
  diagnoses: unknown;
  diagnosisNote: string | null;
  patient: FollowUpPatientResponseDto | null;
  prescription: FollowUpPrescriptionResponseDto | null;
  serviceRequests: FollowUpServiceRequestResponseDto[];
}

export interface FollowUpListItemResponseDto {
  followUpId: string;
  appointmentDate: string | null;
  session: Session | null;
  reason: string | null;
  medicalRecord: FollowUpMedicalRecordResponseDto | null;
}

export interface FollowUpListResponseDto {
  items: FollowUpListItemResponseDto[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}
