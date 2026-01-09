import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceRequestSchema } from "../modules/service-request/dtos/service-request.request.dto";
import { ServiceRequestResponseSchema } from "../modules/service-request/dtos/service-request.response.dto";

const ServiceRequestSwagger = {
  "/api/service-requests": {
    post: {
      tags: ["Service Request"],
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
};

export default ServiceRequestSwagger;
