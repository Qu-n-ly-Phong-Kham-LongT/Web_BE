const SharedSwagger = {
  "/api/medical-records/{id}/full": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy full thông tin bệnh án",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID benh an",
        },
      ],
      responses: {
        200: {
          description: "Lấy full thông tin bệnh án",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FullMedicalRecordDto",
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
  "/api/medical-records/{id}/print": {
    get: {
      tags: ["Core Businesses"],
      summary: "In bệnh án (PDF)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh án",
        },
      ],
      responses: {
        202: {
          description: "Đã thêm vào hàng đợi in bệnh án",
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
  "/api/medical-records/{id}/file": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy file bệnh án (enqueue nếu cần render lại)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh án",
        },
      ],
      responses: {
        200: {
          description: "Thông tin file bệnh án",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      enqueued: { type: "boolean", example: false },
                      file: {
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
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        202: {
          description: "Đang tạo file, đã enqueue job",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      enqueued: { type: "boolean", example: true },
                      stale: { type: "boolean", example: true },
                      file: {
                        oneOf: [
                          { type: "object" },
                          { type: "null" },
                        ],
                      },
                      job: {
                        type: "object",
                        properties: {
                          jobId: { type: "string", format: "uuid" },
                          status: { type: "string" },
                          type: { type: "string" },
                        },
                      },
                    },
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án/file" },
      },
    },
  },
};

export default SharedSwagger;
