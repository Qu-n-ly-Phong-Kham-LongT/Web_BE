import { PatientResponseDto } from "../../patient/dtos/patient.response.dto"
import { MedicalRecordResponseDto } from "../../medical-record/dtos/medical-request.response.dto";
import { FollowUpResponseDto } from "../../follow-up/dtos/follow-up.response.dto";
import { PrescriptionDetailResponseDto } from "../../prescriptions/dtos/prescription.response.dto";
import { ClinicalExaminationResponseDto } from "../../clinical-examination/dtos/clinical-examination.response.dto"
import { ServiceRequestFullResponseDto } from "../../service-request/dtos/service-request.response.dto";

export interface FullMedicalRecordDto {
    patient: PatientResponseDto | null;
    clinicalExamination: ClinicalExaminationResponseDto | null;
    medicalRecord: MedicalRecordResponseDto;
    serviceRequest: ServiceRequestFullResponseDto[];
    prescription: PrescriptionDetailResponseDto | null;
    followUp: FollowUpResponseDto | null;
}