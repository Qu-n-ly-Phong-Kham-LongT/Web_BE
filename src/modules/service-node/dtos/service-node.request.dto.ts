import { NodeType } from "@prisma/client";
import Joi from "joi";

export interface CreateServiceNodeRequestDto {
  nodeType: NodeType;
  parentId?: string | null;
  code: string;
  name: string;
  note?: string;
  isActive?: boolean;
}

export const createServiceNodeSchema = Joi.object({
  nodeType: Joi.string()
    .valid(...Object.values(NodeType))
    .required()
    .messages({
      "any.only": `Node Type không hợp lệ. Chỉ chấp nhận: ${Object.values(NodeType).join(", ")}`,
      "any.required": "Vui lòng chọn Node Type",
    }),

  parentId: Joi.alternatives()
    .conditional("nodeType", {
      is: NodeType.TYPE,
      then: Joi.string().uuid().required().messages({
        "any.required": "Dịch vụ (TYPE) bắt buộc có Danh mục (CATEGORY)",
        "string.guid": "Parent ID phải là UUID hợp lệ",
      }),
      otherwise: Joi.valid(null, "").optional().messages({
        "any.only": "Danh mục (CATEGORY) không có parent ID",
      }),
    })
    .messages({
      "alternatives.match": "Parent ID không hợp lệ",
      "string.guid": "Parent ID phải là UUID hợp lệ",
    }),

  code: Joi.string().trim().min(1).required().messages({
    "string.empty": "Mã code không được để trống",
    "any.required": "Vui lòng nhập mã code",
  }),

  name: Joi.string().trim().min(1).required().messages({
    "string.empty": "Tên hiển thị không được để trống",
    "any.required": "Vui lòng nhập tên hiển thị",
  }),

  note: Joi.string().allow(null, "").optional(),

  isActive: Joi.boolean().optional(),
});

export interface UpdateServiceNodeRequestDto {
  nodeType?: NodeType;
  parentId?: string | null;
  code?: string;
  name?: string;
  note?: string;
  isActive?: boolean;
}

export const updateServiceNodeSchema = Joi.object({
  nodeType: Joi.string()
    .valid(...Object.values(NodeType))
    .optional()
    .messages({
      "any.only": `Node Type không hợp lệ, chỉ chấp nhận: ${Object.values(NodeType).join(", ")}`,
    }),

  parentId: Joi.alternatives()
    .conditional("nodeType", {
      is: NodeType.TYPE,
      then: Joi.string().uuid().required().messages({
        "any.required": "Dịch vụ (TYPE) bắt buộc có parentId (Danh mục)",
        "string.guid": "Parent ID phải là UUID hợp lệ",
      }),
      otherwise: Joi.valid(null, "").optional().messages({
        "any.only": "Danh mục (CATEGORY) không có parentId",
      }),
    })
    .messages({
      "alternatives.match": "Parent ID không hợp lệ",
      "string.guid": "Parent ID phải là UUID hợp lệ",
    }),

  code: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Mã code không được để trống",
  }),

  name: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Tên hiển thị không được để trống",
  }),

  note: Joi.string().allow(null, "").optional(),

  isActive: Joi.boolean().optional(),
}).options({ abortEarly: false });
