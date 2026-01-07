import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreatePrescriptionTemplateRequestSchema } from "../modules/prescription-template/dtos/create-prescription-template.request.dto";
import { UpdatePrescriptionTemplateRequestSchema } from "../modules/prescription-template/dtos/update-prescription-template.request.dto";
import { PrescriptionTemplateResponseSchema } from "../modules/prescription-template/dtos/prescription-template.response.dto";
import { PrescriptionTemplateListResponseSchema } from "../modules/prescription-template/dtos/prescription-template-list.response.dto";

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "integer" },
    size: { type: "integer" },
    totalItems: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

const PrescriptionTemplateSwagger = {
  "/api/prescription-templates": {
    post: {
      tags: ["Prescription Template"],
      summary: "Tạo mới mẫu đơn thuốc",
      description: "Tạo mẫu đơn thuốc mới với danh sách thuốc và liều lượng mặc định",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(CreatePrescriptionTemplateRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo mẫu đơn thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PrescriptionTemplateResponseSchema),
            },
          },
        },
        400: {
          description: "Lỗi validation hoặc thuốc trùng lặp/không tồn tại",
        },
      },
    },
    get: {
      tags: ["Prescription Template"],
      summary: "Lấy danh sách mẫu đơn thuốc",
      description: "Lấy danh sách mẫu đơn thuốc có phân trang và tìm kiếm",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Số trang",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Số lượng mỗi trang",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Tìm kiếm theo tên hoặc mô tả mẫu đơn",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách mẫu đơn thuốc thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Lấy danh sách mẫu đơn thuốc thành công",
                  },
                  data: {
                    type: "array",
                    items: joiToSwagger(PrescriptionTemplateResponseSchema),
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/prescription-templates/{id}": {
    get: {
      tags: ["Prescription Template"],
      summary: "Lấy thông tin mẫu đơn thuốc theo ID",
      description: "Lấy chi tiết mẫu đơn thuốc bao gồm danh sách thuốc và liều lượng",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID của mẫu đơn thuốc cần lấy",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin mẫu đơn thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PrescriptionTemplateResponseSchema),
            },
          },
        },
        404: {
          description: "Không tìm thấy mẫu đơn thuốc",
        },
      },
    },
    put: {
      tags: ["Prescription Template"],
      summary: "Cập nhật mẫu đơn thuốc",
      description: "Cập nhật thông tin mẫu đơn thuốc. Có thể cập nhật tên, mô tả và/hoặc danh sách thuốc. Khi cập nhật details: items có templateDetailId sẽ được update, items không có sẽ được tạo mới, items không gửi trong request sẽ bị xóa.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID của mẫu đơn thuốc cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdatePrescriptionTemplateRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật mẫu đơn thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PrescriptionTemplateResponseSchema),
            },
          },
        },
        400: {
          description: "Lỗi validation hoặc thuốc trùng lặp/không tồn tại",
        },
        404: {
          description: "Không tìm thấy mẫu đơn thuốc",
        },
      },
    },
  },
};

export default PrescriptionTemplateSwagger;

