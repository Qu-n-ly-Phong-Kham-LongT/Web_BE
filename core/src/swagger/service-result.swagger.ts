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
            examples: {
              byItemId: {
                summary: "Nhập kết quả cho phiếu chỉ định tương ứng với từng cấu hình đã chọn",
                value: {
                  requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                  details: [
                    {
                      itemId: "fe8040de-67ef-4998-b7a1-f39dd4dc307b",
                      results: [
                        {
                          configId: "45d14fd2-7cb9-4a51-9342-dd7d9e886467",
                          valueString: "Co",
                        },
                      ],
                    },
                  ],
                },
              },
              byDetailId: {
                summary: "Khó",
                value: {
                  requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                  details: [
                    {
                      detailId: "5789213b-8a4c-4f68-b416-45a1805d0a69",
                      results: [
                        {
                          configId: "45d14fd2-7cb9-4a51-9342-dd7d9e886467",
                          valueString: "Co",
                        },
                      ],
                    },
                  ],
                },
              },
            },
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
            examples: {
              byItemId: {
                summary: "Upsert kết quả cho phiếu chỉ định với đơn vị cụ thể",
                value: {
                  requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                  details: [
                    {
                      itemId: "fe8040de-67ef-4998-b7a1-f39dd4dc307b",
                      results: [
                        {
                          configId: "45d14fd2-7cb9-4a51-9342-dd7d9e886467",
                          valueString: "Co",
                        },
                      ],
                    },
                  ],
                },
              },
            },
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
