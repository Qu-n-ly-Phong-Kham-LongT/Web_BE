import { CreateServiceItemRequestDto } from "../dtos/service-item.request.dto";
import { ServiceItemService } from "../services/service-item.service";
import { Request, Response } from "express"
import { successResponse } from "../../../utils/response.util";

export class ServiceItemController {
    private service = new ServiceItemService();

    public create = async (req: Request<{},{},CreateServiceItemRequestDto>, res: Response) => 
    {
        const data = req.body;
        const newItem = await this.service.createItem(data);
        return successResponse(res, 201, newItem, "Tạo dịch vụ cận lâm sàng thành công");
    }
}