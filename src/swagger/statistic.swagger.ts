const StatisticSwagger = {
  "/api/statistic/dashboard": {
    get: {
      tags: ["Statistic"],
      summary: "Lấy dữ liệu dashboard",
      parameters: [
        {
          name: "range",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["day", "week", "month"], default: "day" },
          description: "Kiểu cột biểu đồ: day|week|month",
        },
        {
          name: "points",
          in: "query",
          required: false,
          schema: { type: "integer", default: 7, minimum: 1 },
          description: "Số cột biểu đồ (hiện tại và trước đó)",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 5, minimum: 1 },
          description: "Số lượng bệnh nhân gần đây",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy dữ liệu dashboard thành công",
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
                      counters: {
                        type: "object",
                        properties: {
                          today: { type: "number" },
                          week: { type: "number" },
                          month: { type: "number" },
                        },
                      },
                      chart: {
                        type: "object",
                        properties: {
                          range: { type: "string", enum: ["day", "week", "month"] },
                          labels: { type: "array", items: { type: "string" } },
                          values: { type: "array", items: { type: "number" } },
                          latest: { type: "number" },
                          average: { type: "number" },
                          trendPct: { type: "number" },
                        },
                      },
                      recentPatients: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            patientId: { type: "string", format: "uuid" },
                            fullName: { type: "string" },
                            at: { type: "string", format: "date-time" },
                          },
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
        403: { description: "Không có quyền truy cập" },
      },
    },
  },

  "/api/statistic/range-types": {
    get: {
      tags: ["Statistic"],
      summary: "Lấy danh sách loại khoảng thời gian",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "OK",
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
                      rangeTypes: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: ["day", "week", "month"],
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
      },
    },
  },
};

export default StatisticSwagger;
