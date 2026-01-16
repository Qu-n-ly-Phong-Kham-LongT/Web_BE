import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";

export interface ServiceItemDisplayDto {
  itemId: string;
  itemCode: string;
  name: string;
  selectedOptionsText: string; // "(Có tiêm phản quang, Tái tạo mạch máu)"
}

export interface PrintServiceRequestSelectedConfigDto {
  requestId: string;
  requestDetailId: string;
  itemId: string;
  configId: string;
  configCode: string;
  displayName: string;
  selectedValues: string[];
  totalSurcharge: string;
}

export interface PrintServiceItem {
  index: number;
  name: string;
  quantity: number;
}

export interface PrintTypeGroup {
  typeName: string;
  items: PrintServiceItem[];
}

export interface ServiceRequestPrintData {
  requestCode: string;
  barcode: Buffer;

  patientName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  diagnosisMainCode: string;
  diagnosisMainDescription: string;
  diagnosisSecondary: MedicalDiagnosisDto["secondary"];
  requestSelectedConfigs: PrintServiceRequestSelectedConfigDto[],
  groups: PrintTypeGroup[];
  date: string;
}
