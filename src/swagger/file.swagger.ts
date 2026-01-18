import { FileType } from "@prisma/client";
import { joiToSwagger } from "../utils/joi-swagger.util";
import { DeleteFileRequestSchema } from "../modules/file/dtos/delete-file.request.dto";

const FileSwagger = {
  "/api/files": {
    get: {
      tags: ["Files"],
      summary: "Lấy danh sách file",
      description:
        "Lấy danh sách file dựa trên loại (type) và ID liên quan (medicalRecordId, serviceRequestId,...)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "type",
          in: "query",
          required: true,
          schema: { type: "string", enum: Object.values(FileType) },
          description: "Loại file cần lấy",
        },
        {
          name: "id",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "ID liên quan (Ví dụ: truyền requestId nếu type là SERVICE_RESULT)",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
          description: "Số trang hiện tại",
        },
        {
          name: "size",
          in: "query",
          schema: { type: "integer", default: 10 },
          description: "Số lượng item mỗi trang",
        },
        {
          name: "sort",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Sắp xếp theo thời gian tạo",
        },
      ],
      responses: {
        200: {
          description: "Thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fileId: { type: "string" },
                        relativePath: { type: "string" },
                        url: { type: "string" },
                        type: { type: "string" },
                        size: { type: "number" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      currentPage: { type: "number" },
                      size: { type: "number" },
                      totalItems: { type: "number" },
                      totalPages: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/files/upload": {
    post: {
      tags: ["Files"],
      summary: "Tải file",
      description: "Tải file lên server",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "type",
          in: "query",
          required: true,
          schema: {
            type: "string",
            enum: Object.values(FileType),
          },
          description: "Loại file cần được upload",
        },
        {
          name: "medicalRecordId",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Nếu là bệnh án thì điền id này",
        },
        {
          name: "prescriptionId",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Nếu là toa thuốc thì điền id này",
        },
        {
          name: "serviceRequestId",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Nếu là phiếu chỉ định CLS thì điền id này",
        },
        {
          name: "serviceResultId",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Nếu là kết quả phiếu chỉ định thì điền id này",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "File to upload (Max 10MB)",
                },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 200 },
                  message: {
                    type: "string",
                    example: "File uploaded successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      FileID: { type: "string" },
                      RelativePath: { type: "string" },
                      Type: { type: "string" },
                      MimeType: { type: "string" },
                      Size: { type: "number" },
                      CreatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Bad request - No file uploaded or invalid file type",
        },
        401: {
          description: "Unauthorized - Token required",
        },
      },
    },
  },

  "/api/files/delete": {
    post: {
      tags: ["Files"],
      summary: "Delete file",
      description: "Delete a file from the server by its relative path",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DeleteFileRequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: "File deleted successfully",
        },
      },
    },
  },
  "/api/files/service-results/{requestId}": {
    delete: {
      tags: ["Files"],
      summary: "Xóa toàn bộ ảnh kết quả của một dịch vụ",
      description:
        "Xóa tất cả file có type là SERVICE_RESULT gắn với requestId này",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Xóa thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Đã xóa toàn bộ file kết quả của dịch vụ này",
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/files/medical-record/{recordId}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy file bệnh án theo mã bệnh án",
      description: "Trả về thông tin file gắn với bệnh án theo recordId",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "recordId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Mã bệnh án (recordId)",
        },
      ],
      responses: {
        200: {
          description: "Lấy file bệnh án thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 200 },
                  message: {
                    type: "string",
                    example: "Lấy file bệnh án thành công",
                  },
                  data: {
                    type: "object",
                    properties: {
                      fileId: { type: "string" },
                      relativePath: { type: "string" },
                      url: { type: "string" },
                      type: { type: "string" },
                      mimeType: { type: "string" },
                      size: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Không tìm thấy file bệnh án",
        },
        401: {
          description: "Chưa đăng nhập hoặc token không hợp lệ",
        },
      },
    },
  },
};

export default FileSwagger;
