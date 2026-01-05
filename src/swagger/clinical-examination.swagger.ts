import { joiToSwagger } from "../utils/joi-swagger.util";
import { ClinicalExaminationRequestSchema } from "../modules/clinical-examination/dtos/clinical-examination.request.dto";

const ClinicalExaminationSwagger = {
  "/api/medical-records/{recordId}/clinical-examinations": {
    put: {
      tags: ["Khám lâm sàng"],
      summary: "Lưu (tạo/cập nhật) khám lâm sàng cho bệnh án",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "recordId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh án",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(ClinicalExaminationRequestSchema),
          },
        },
      },
      responses: {
        200: { description: "Lưu khám lâm sàng thành công" },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền hoặc bệnh án không thuộc phòng khám" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
};

export default ClinicalExaminationSwagger;
