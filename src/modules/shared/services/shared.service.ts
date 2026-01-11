import { BaseError } from "../../../utils/base-error.util";
import { FullMedicalRecordDto } from "../dtos/medical-record-detail.dto";
import { SharedRepository } from "../repositories/shared.repository";

export class SharedService {
    private sharedReposoitory = new SharedRepository();

    public async getFullMedicalRecord(recordId: string, clinicId: string): Promise<FullMedicalRecordDto | null> {
        const result = await this.sharedReposoitory.getFullMedicalRecord(recordId);
        
        if (!result) {
            throw new BaseError(400, "Không tìm thấy bệnh án")
        }

        if (result?.medicalRecord.clinicId && result?.medicalRecord.clinicId !== clinicId) {
            throw new BaseError(403, "Bệnh án không thuộc phòng khám")
        }

        return result;
    }
}