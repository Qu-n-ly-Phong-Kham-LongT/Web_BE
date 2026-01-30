import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { DictionaryRequestDto } from "../dtos/dictionary.request.dto";
import { DictionaryService } from "../services/dictionary.service";
import {
  DictionaryBulkDeleteDto,
  DictionaryBulkInsertDto,
} from "../dtos/dictionary.bulk.dto";

export class DictionaryController {
  private dictionaryService = new DictionaryService();

  public create = async (
    req: Request<{}, {}, DictionaryRequestDto>,
    res: Response,
  ) => {
    const result = await this.dictionaryService.create(req.body);
    return successResponse(res, 200, result, "Tạo từ khoá thành công");
  };

  public getByKey = async (req: Request<{ key: string }>, res: Response) => {
    const result = await this.dictionaryService.getByKey(req.params.key);
    return successResponse(res, 200, result, "Lấy từ khoá thành công");
  };

  public update = async (
    req: Request<{ key: string }, {}, DictionaryRequestDto>,
    res: Response,
  ) => {
    const newKey = req.body.key ?? req.params.key;
    const result = await this.dictionaryService.update(
      req.params.key,
      newKey,
      req.body.value ?? null,
    );
    return successResponse(res, 200, result, "Cập nhật từ khoá thành công");
  };

  public delete = async (req: Request<{ key: string }>, res: Response) => {
    const result = await this.dictionaryService.delete(req.params.key);
    return successResponse(res, 200, result, "Xoá từ khoá thành công");
  };

  public list = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const sortByParam = (req.query.sortBy as string | undefined) ?? "key";
    const sortBy = sortByParam === "value" ? "value" : "key";
    const sort =
      (req.query.sort as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    const result = await this.dictionaryService.list(
      page,
      size,
      search,
      sortBy,
      sort,
    );
    return successResponse(
      res,
      200,
      result.items,
      "Lấy danh sách từ khoá thành công",
      result.pagination,
    );
  };

  public insertBulk = async (
    req: Request<{}, {}, DictionaryBulkInsertDto>,
    res: Response,
  ) => {
    const result = await this.dictionaryService.insertBulk(req.body.items);
    return successResponse(res, 201, result, "Insert bulk thành công");
  };

  public deleteBulk = async (
    req: Request<{}, {}, DictionaryBulkDeleteDto>,
    res: Response,
  ) => {
    const result = await this.dictionaryService.deleteBulk(req.body.keys);
    return successResponse(res, 200, result, "Delete bulk thành công");
  };
}
