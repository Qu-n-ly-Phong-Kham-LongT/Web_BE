import { joiToSwagger } from "../utils/joi-swagger.util";
import { DeleteFileRequestSchema } from "../modules/file/dtos/delete-file.request.dto";

const ResultFileSwagger = {
  "/api/result-files/uploads": {
    post: {
      tags: ["Result Files"],
      summary: "Tải lên hàng loạt kết quả dịch vụ",
      description:
        "Tải nhiều file kết quả cùng lúc gắn với một phiếu chỉ định (Service Request)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                serviceRequestId: {
                  type: "string",
                  format: "uuid",
                  description:
                    "ID của phiếu chỉ định dịch vụ",
                },
                files: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "Danh sách các file kết quả (Tối đa 10 file)",
                },
              },
              required: ["serviceRequestId", "files"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Upload danh sách kết quả thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 200 },
                  message: {
                    type: "string",
                    example: "Upload danh sách kết quả thành công",
                  },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fileId: { type: "string" },
                        relativePath: { type: "string" },
                        url: { type: "string" },
                        size: { type: "number" },
                        mimeType: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Thiếu thông tin hoặc file không hợp lệ" },
        401: { description: "Token không hợp lệ hoặc hết hạn" },
      },
    },
  },

//   "/api/result-files/service-request/{requestId}": {
//     get: {
//       tags: ["Result Files"],
//       summary: "Lấy danh sách file kết quả theo phiếu chỉ định",
//       description: "Trả về toàn bộ danh sách file kết quả gắn với requestId",
//       security: [{ bearerAuth: [] }],
//       parameters: [
//         {
//           name: "requestId",
//           in: "path",
//           required: true,
//           schema: { type: "string", format: "uuid" },
//           description: "Mã phiếu chỉ định dịch vụ (requestId)",
//         },
//       ],
//       responses: {
//         200: {
//           description: "Lấy danh sách file thành công",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   statusCode: { type: "number", example: 200 },
//                   message: {
//                     type: "string",
//                     example: "Lấy danh sách file thành công",
//                   },
//                   data: {
//                     type: "array",
//                     items: {
//                       type: "object",
//                       properties: {
//                         fileId: { type: "string" },
//                         relativePath: { type: "string" },
//                         url: { type: "string" },
//                         size: { type: "number" },
//                         mimeType: { type: "string" },
//                         createdAt: { type: "string", format: "date-time" },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//         404: { description: "Không tìm thấy dữ liệu" },
//       },
//     },
//   },

//   "/api/result-files/delete": {
//     post: {
//       tags: ["Result Files"],
//       summary: "Xoá file kết quả",
//       description:
//         "Xoá file kết quả khỏi server và database dựa trên đường dẫn tương đối",
//       security: [{ bearerAuth: [] }],
//       requestBody: {
//         required: true,
//         content: {
//           "application/json": {
//             schema: joiToSwagger(DeleteFileRequestSchema),
//           },
//         },
//       },
//       responses: {
//         200: { description: "Xoá file thành công" },
//         500: { description: "Lỗi hệ thống khi xoá file" },
//       },
//     },
//   },
};

export default ResultFileSwagger;
