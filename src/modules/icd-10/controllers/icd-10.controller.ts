import { Request, Response } from "express";
import { Icd10Service } from "../services/icd-10.service";
import { Icd10RequestDto } from "../dtos/icd-10.dto";
import { successResponse } from "../../../utils/response.util";

export class Icd10Controller {
  private icd10Service = new Icd10Service();

  public createIcd10 = async (
    req: Request<{}, {}, Icd10RequestDto>,
    res: Response
  ) => {
    const result = await this.icd10Service.createIcd10(req.body);
    return successResponse(res, 201, result, "Tạo ICD-10 thành công");
  };

  public updateIcd10 = async (
    req: Request<{ code: string }, {}, Icd10RequestDto>,
    res: Response
  ) => {
    const { code } = req.params;
    const result = await this.icd10Service.updateIcd10(code, req.body);
    return successResponse(res, 200, result, "Cập nhật ICD-10 thành công");
  };

  public deleteIcd10 = async (
    req: Request<{ code: string }>,
    res: Response
  ) => {
    const code = req.params.code;
    await this.icd10Service.deleteIcd10(code);
    return successResponse(res, 200, "Xoá ICD-10 thành công")
  };

  public getAllIcd10 = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await this.icd10Service.getAllIcd10(page, size, search);
    return successResponse(
      res,
      200,
      result.icd10s,
      "Lấy danh sách ICD-10 thành công",
      result.pagination
    );
  };
}
