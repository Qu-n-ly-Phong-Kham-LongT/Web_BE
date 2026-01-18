import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceRequestSchema } from "../modules/service-request/dtos/service-request.request.dto";
import {
  ServiceRequestResponseSchema,
  ServiceRequestFullResponseSchema,
} from "../modules/service-request/dtos/service-request.response.dto";

const ServiceRequestSwagger = {
  "/api/service-requests/init": {
    post: {
      tags: ["Core Businesses"],
      summary: "Khởi tạo phiếu chỉ định rỗng",
      description:
        "Tạo một bản ghi nháp để lấy requestId và requestCode trước khi điền thông tin.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["recordId"],
              properties: {
                recordId: {
                  type: "string",
                  format: "uuid",
                  description: "ID của hồ sơ bệnh án",
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Khởi tạo thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceRequestResponseSchema),
            },
          },
        },
      },
    },
  },

  "/api/service-requests/{requestId}": {
    put: {
      tags: ["Core Businesses"],
      summary: "Lưu nội dung phiếu chỉ định (Upsert)",
      description:
        "Cập nhật chẩn đoán và đồng bộ danh sách dịch vụ (xóa cũ thêm mới).",
      parameters: [
        {
          name: "requestId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID phiếu chỉ định đã khởi tạo",
        },
      ],
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
        200: {
          description: "Cập nhật thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ServiceRequestResponseSchema),
              examples: {
                created: {
                  summary: "Tạo chỉ định thành công",
                  value: {
                    success: true,
                    message: "Created",
                    data: {
                      requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                      requestCode: "SR-0001",
                      recordId: "0ef0793d-f6f2-4e6f-a8d9-43d92c41f3f5",
                      orderingDoctorId: "c10065eb-fd3a-4887-bcf6-423a2e6c9de7",
                      diagnoses: null,
                      isPatientRequested: false,
                      receiveResultAtClinic: false,
                      isForFollowUp: false,
                      note: null,
                      createdAt: "2026-01-16T10:00:00.000Z",
                      details: [
                        {
                          requestDetailId:
                            "5789213b-8a4c-4f68-b416-45a1805d0a69",
                          itemId: "9b20993b-11f9-4986-88b1-296947c9c604",
                          itemCode: "HBsAg",
                          itemName: "HBsAg",
                          selectedOptions: null,
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Dữ liệu không hợp lệ" },
        404: { description: "Không tìm thấy phiếu chỉ định" },
      },
    },
    "/api/service-requests": {
      post: {
        tags: ["Core Businesses"],
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
                examples: {
                  created: {
                    summary: "Tạo chỉ định thành công",
                    value: {
                      success: true,
                      message: "Created",
                      data: {
                        requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                        requestCode: "SR-0001",
                        recordId: "0ef0793d-f6f2-4e6f-a8d9-43d92c41f3f5",
                        orderingDoctorId:
                          "c10065eb-fd3a-4887-bcf6-423a2e6c9de7",
                        diagnoses: null,
                        isPatientRequested: false,
                        receiveResultAtClinic: false,
                        isForFollowUp: false,
                        note: null,
                        createdAt: "2026-01-16T10:00:00.000Z",
                        details: [
                          {
                            requestDetailId:
                              "5789213b-8a4c-4f68-b416-45a1805d0a69",
                            itemId: "9b20993b-11f9-4986-88b1-296947c9c604",
                            itemCode: "HBsAg",
                            itemName: "HBsAg",
                            selectedOptions: null,
                          },
                        ],
                      },
                    },
                  },
                },
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
    "/api/service-requests/{id}": {
      get: {
        tags: ["Core Businesses"],
        summary: "Lấy chi tiết phiếu chỉ định cận lâm sàng",
        description: "Lấy đầy thủ thông tin chi tiết phiếu chỉ định.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "ID phiếu chỉ định",
          },
        ],
        responses: {
          200: {
            description: "Lấy chi tiết phiếu chỉ định",
            content: {
              "application/json": {
                schema: joiToSwagger(ServiceRequestFullResponseSchema),
                examples: {
                  detail: {
                    summary: "Chi tiết phiếu chỉ định với đơn vị kết quả",
                    value: {
                      success: true,
                      message: "OK",
                      data: {
                        requestId: "7b0eb3bb-5652-4cc5-90e4-493081e22b65",
                        requestCode: "SR-0001",
                        recordId: "0ef0793d-f6f2-4e6f-a8d9-43d92c41f3f5",
                        recordCode: "MR-0001",
                        orderingDoctorId:
                          "c10065eb-fd3a-4887-bcf6-423a2e6c9de7",
                        diagnoses: null,
                        isPatientRequested: false,
                        receiveResultAtClinic: false,
                        isForFollowUp: false,
                        note: null,
                        createdAt: "2026-01-16T10:00:00.000Z",
                        patientId: "11111111-1111-1111-1111-111111111111",
                        details: [
                          {
                            requestDetailId:
                              "5789213b-8a4c-4f68-b416-45a1805d0a69",
                            itemId: "9b20993b-11f9-4986-88b1-296947c9c604",
                            itemCode: "HBsAg",
                            itemName: "HBsAg",
                            selectedOptions: null,
                            selectedConfigs: [
                              {
                                configId:
                                  "1b540d22-c353-42c7-a752-5f065f90ed67",
                                configCode: "HBsAg",
                                displayName: "HBsAg",
                                unit: "mIU/mL",
                                selectedValues: [],
                                totalSurcharge: 0,
                              },
                            ],
                            results: [],
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Chưa đăng nhập" },
          403: { description: "Không đủ quyền truy cập" },
          404: { description: "Không tìm thấy phiếu chỉ định" },
        },
      },
    },

    "/api/service-requests/{requestId}/print": {
      get: {
        tags: ["Core Businesses"],
        summary: "In phiếu chỉ định",
        parameters: [
          {
            name: "requestId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "PDF Phiếu chỉ định",
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          401: { description: "Chưa đăng nhập" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
        },
      },
    },
  },
};

export default ServiceRequestSwagger;
