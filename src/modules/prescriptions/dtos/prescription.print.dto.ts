export interface PrescriptionPrintDto {
  prescriptionId: string;
  prescriptionCode: string;
  barcode: Buffer;
  details: PrescriptionDetail[];
  followUpDate: string;
  reason: string;
  printCount: number;
  clinicName: string;
  clinicAddress: string;
  clinicPhones: string[];
  clinicPhonesText: string;
  doctorName: string;
}

export interface PrescriptionDetail {
  index: number;
  medicineId: string;
  medicineName: string;
  frequencyPerDay: string;
  quantityPerTime: string;
  quantity: string;
  unit: string;
  administrationRoute: string;
  timing: string;
  daysToTake: string;
  note: string;
  prepNote: string;
  isInsuranceCovered: string;
}
