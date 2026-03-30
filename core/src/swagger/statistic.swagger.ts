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

  "/api/statistic/prescriptions/revenue": {
    get: {
      tags: ["Statistic"],
      summary: "Thống kê doanh thu thuốc",
      parameters: [
        {
          name: "range",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["day", "week", "month"], default: "month" },
          description: "Kiểu cột biểu đồ: day|week|month",
        },
        {
          name: "points",
          in: "query",
          required: false,
          schema: { type: "integer", default: 4, minimum: 1 },
          description: "Số cột biểu đồ",
        },
        {
          name: "top",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10, minimum: 1 },
          description: "Số lượng thuốc top theo doanh thu",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "ấy thống kê doanh thu thuốc thành công",
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
                      summary: {
                        type: "object",
                        properties: {
                          totalRevenue: { type: "number" },
                          totalMedicines: { type: "number" },
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
                      breakdown: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            medicineId: { type: "string", format: "uuid" },
                            medicineName: { type: "string" },
                            revenue: { type: "number" },
                            quantity: { type: "number" },
                            pct: { type: "number" },
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

  "/api/statistic/revenue": {
    get: {
      tags: ["Statistic"],
      summary: "Thống kê doanh thu",
      parameters: [
        {
          name: "range",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["day", "week", "month"], default: "day" },
          description: "Phạm vi thống kê: day|week|month",
        },
        {
          name: "date",
          in: "query",
          required: false,
          schema: { type: "string", format: "date", example: "2026-02-02" },
          description: "Theo ngày (YYYY-MM-DD, giờ VN). Dùng khi range=day.",
        },
        {
          name: "startDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date", example: "2026-02-02" },
          description: "Ngày thứ 2 của tuần (YYYY-MM-DD). Dùng khi range=week.",
        },
        {
          name: "weekNumber",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, example: 6 },
          description: "Số tuần ISO. Dùng khi range=week (cần kèm year).",
        },
        {
          name: "year",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 2000, example: 2026 },
          description: "Năm dùng cho weekNumber hoặc month.",
        },
        {
          name: "month",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 12, example: 2 },
          description: "Tháng (1-12). Dùng khi range=month.",
        },
        {
          name: "view",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["week"] },
          description: "Góc nhìn theo tuần trong tháng (hiện tại chỉ hỗ trợ week).",
        },
        {
          name: "points",
          in: "query",
          required: false,
          schema: { type: "integer", default: 7, minimum: 1 },
          description: "Tham số: số cột biểu đồ (khi không dùng date/startDate/weekNumber/month).",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thống kê doanh thu thành công",
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
                      totalRevenue: { type: "number" },
                      totalPrescription: { type: "number" },
                      totalProfit: { type: "number" },
                      totalProfitMedicine: { type: "number" },
                      totalConsultation: { type: "number" },
                      medicineBreakdown: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            medicineId: { type: "string", format: "uuid" },
                            medicineName: { type: "string" },
                            quantity: { type: "number" },
                            revenue: { type: "number" },
                            cost: { type: "number" },
                            profit: { type: "number" },
                          },
                        },
                      },
                      chart: {
                        type: "object",
                        properties: {
                          range: { type: "string", enum: ["day", "week", "month"] },
                          granularity: { type: "string", enum: ["hour", "day", "week"] },
                          labels: { type: "array", items: { type: "string" } },
                          prescriptionValues: { type: "array", items: { type: "number" } },
                          profitValues: { type: "array", items: { type: "number" } },
                          consultationValues: { type: "array", items: { type: "number" } },
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
