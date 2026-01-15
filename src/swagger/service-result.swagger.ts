import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceResultBulkSchema } from "../modules/service-result/dtos/service-result.request.dto";
import { ServiceResultResponseSchema } from "../modules/service-result/dtos/service-result.response.dto";

import Joi from "joi";

const ServiceResultListResponseSchema = Joi.object({
  success: Joi.boolean(),
  message: Joi.string(),
  data: Joi.array().items(ServiceResultResponseSchema),
  pagination: Joi.any(),
});

const ServiceResultSwagger = {
  "/api/service-results": {
    post: {
      tags: ["Core Businesses"],
      summary: "Tạo kết quả cận lâm sàng",
      description: "Bác sĩ nhập kết quả cho phiếu CLS",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(createServiceResultBulkSchema),
          },
        },
      },
      responses: {
        201: {
          description: "Tạo kết quả CLS thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceResultListResponseSchema),
            },
          },
        },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy phiếu chỉ định" },
        409: { description: "Kết quả đã tồn tại" },
      },
    },
    put: {
      tags: ["Core Businesses"],
      summary: "Cập nhất kết quả cận lâm sàng",
      description: "Cập nhật hoặc tạo mới kết quả CLS",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(createServiceResultBulkSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Cập nhật kết quả CLS thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceResultListResponseSchema),
            },
          },
        },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy phiếu chỉ định" },
      },
    },
  },
};

export default ServiceResultSwagger;
