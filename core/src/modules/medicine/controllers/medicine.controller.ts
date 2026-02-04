import { MedicineService } from "../services/medicine.service";
import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreateMedicineRequestDto } from "../dtos/create-medicine.request.dto";
import { UpdateMedicineRequestDto } from "../dtos/update-medicine.request.dto";
import { MedicineResponseDto } from "../dtos/medicine.response.dto";
import { MedicineListResponseDto } from "../dtos/medicine-list.response.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class MedicineController {
  private medicineService = new MedicineService();

  public createMedicine = async (
    req: AuthenticatedRequest<{}, any, CreateMedicineRequestDto>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    let result: MedicineResponseDto = await this.medicineService.createMedicine(
      req.body,
      clinicId,
    );
    return successResponse(res, 201, result, "Tạo thuốc thành công");
  };

  public getMedicineById = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    let result: MedicineResponseDto =
      await this.medicineService.getMedicineById(id, clinicId);
    return successResponse(res, 200, result, "Lấy thông tin thuốc thành công");
  };

  public getMedicines = async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const clinicId = req.payload?.clinicId ?? undefined;
    const supplier = req.query.supplier as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
      isActiveParam === undefined ? undefined : isActiveParam === "true";
    const isInsuranceCoveredParam = req.query.isInsuranceCovered as
      | string
      | undefined;
    const isInsuranceCovered =
      isInsuranceCoveredParam === undefined
        ? undefined
        : isInsuranceCoveredParam === "true";
    const sellPriceRaw = req.query.sellPrice as string | undefined;
    const minPriceRaw = req.query.minPrice as string | undefined;
    const maxPriceRaw = req.query.maxPrice as string | undefined;
    const sellPrice = sellPriceRaw ? Number(sellPriceRaw) : undefined;
    const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
    const sortByParam = (req.query.sortBy as string | undefined) ?? "createdAt";
    const sortBy = [
      "medicineName",
      "sellPrice",
      "createdAt",
      "medicineCode",
    ].includes(sortByParam)
      ? (sortByParam as
          | "medicineName"
          | "sellPrice"
          | "createdAt"
          | "medicineCode")
      : "createdAt";
    const sort =
      (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    let result: MedicineListResponseDto =
      await this.medicineService.getMedicines(page, size, search, clinicId, {
        supplier,
        isActive,
        isInsuranceCovered,
        sellPrice: Number.isFinite(sellPrice as number) ? sellPrice : undefined,
        minPrice: Number.isFinite(minPrice as number) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : undefined,
        sortBy,
        sort,
      });
    return successResponse(
      res,
      200,
      result.medicines,
      "Lấy danh sách thuốc thành công",
      result.pagination,
    );
  };

  public updateMedicine = async (
    req: AuthenticatedRequest<{ id: string }, {}, UpdateMedicineRequestDto>,
    res: Response,
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;
    let result: MedicineResponseDto = await this.medicineService.updateMedicine(
      id,
      req.body,
      clinicId,
    );
    return successResponse(
      res,
      200,
      result,
      "Cập nhật thông tin thuốc thành công",
    );
  };

  public deleteMedicine = async (
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
  ) => {
    const { id } = req.params;
    const clinicId = req.payload?.clinicId ?? undefined;

    await this.medicineService.deleteMedicine(id, clinicId);
    return successResponse(res, 200, null, "Xoá thuốc thành công")
  };
}
