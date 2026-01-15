import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceRequestSchema } from "../modules/service-request/dtos/service-request.request.dto";
import {
  ServiceRequestResponseSchema,
  ServiceRequestFullResponseSchema,
} from "../modules/service-request/dtos/service-request.response.dto";

const ServiceRequestSwagger = {
  "/api/service-requests": {
    post: {
      tags: ["Core Businesses"],
      summary: "Tạo chỉ định cận lâm sàng",
      description: "Tạo phiếu chỉ định cận lâm sàng với danh sách dịch vụ",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(createServiceRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo chỉ định cận lâm sàng thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceRequestResponseSchema),
            },
          },
        },
        400: {
          description: "Lỗi validation hoặc dịch vụ không tồn tại",
        },
        404: {
          description: "Không tìm thấy bệnh án hoặc bác sĩ",
        },
      },
    },
  },
  "/api/service-requests/{id}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy chi tiết phiếu chỉ định cận lâm sàng",
      description: "Lấy đầy thủ thông tin chi tiết phiếu chỉ định.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID phiếu chỉ định",
        },
      ],
      responses: {
        200: {
          description: "Lấy chi tiết phiếu chỉ định",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceRequestFullResponseSchema),
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền truy cập" },
        404: { description: "Không tìm thấy phiếu chỉ định" },
      },
    },
  },
};

export default ServiceRequestSwagger;
