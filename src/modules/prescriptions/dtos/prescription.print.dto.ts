export interface PrescriptionPrintDto {
  prescriptionId: string;
  prescriptionCode: string;
  barcode: Buffer;
  details: PrescriptionDetail[];
  followUpDate: string;
  printCount: number; 
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
