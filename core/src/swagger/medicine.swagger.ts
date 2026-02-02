import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreateMedicineRequestSchema } from "../modules/medicine/dtos/create-medicine.request.dto";
import { UpdateMedicineRequestSchema } from "../modules/medicine/dtos/update-medicine.request.dto";
import { MedicineResponseSchema } from "../modules/medicine/dtos/medicine.response.dto";
import { MedicineListResponseSchema } from "../modules/medicine/dtos/medicine-list.response.dto";

const MedicineSwagger = {
  "/api/medicines": {
    post: {
      tags: ["Medicine"],
      summary: "Tạo mới thuốc",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(CreateMedicineRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(MedicineResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ["Medicine"],
      summary: "Lấy danh sách thuốc",
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
          description: "Tìm kiếm theo tên thuốc, mã thuốc, hoạt chất hoặc nhà cung cấp",
        },
        {
          name: "supplier",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Lọc theo nhà cung cấp",
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc theo trạng thái active",
        },
        {
          name: "isInsuranceCovered",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc theo bảo hiểm chi trả",
        },
        {
          name: "sellPrice",
          in: "query",
          required: false,
          schema: { type: "number" },
          description: "Giá bán",
        },
        {
          name: "minPrice",
          in: "query",
          required: false,
          schema: { type: "number" },
          description: "Giá bán tối thiểu",
        },
        {
          name: "maxPrice",
          in: "query",
          required: false,
          schema: { type: "number" },
          description: "Giá bán tối đa",
        },
        {
          name: "sortBy",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["medicineName", "sellPrice", "createdAt", "medicineCode"],
            default: "createdAt",
          },
          description: "Sắp xếp theo trường",
        },
        {
          name: "sort",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Hướng sắp xếp",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(MedicineListResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/medicines/{id}": {
    get: {
      tags: ["Medicine"],
      summary: "Lấy thông tin thuốc theo ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của thuốc cần lấy",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(MedicineResponseSchema),
            },
          },
        },
      },
    },
    put: {
      tags: ["Medicine"],
      summary: "Cập nhật thông tin thuốc",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của thuốc cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdateMedicineRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật thông tin thuốc thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(MedicineResponseSchema),
            },
          },
        },
      },
    },
  },
};

export default MedicineSwagger;

