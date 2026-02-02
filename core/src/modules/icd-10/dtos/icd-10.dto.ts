import Joi from "joi";

export const ICD10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;

export interface Icd10RequestDto {
    code: string;
    description?: string;
}

export interface Icd10ResponseDto {
    code: string;
    description?: string;
}

export interface Icd10ListResponseDto {
    icd10s: Icd10ResponseDto[];
    pagination: {
        currentPage: number;
        size: number;
        totalItems: number;
        totalPages: number;
    };
}

export const Icd10RequestSchema = Joi.object<Icd10RequestDto>({
    code: Joi.string().uppercase().pattern(ICD10_REGEX).required().messages({
        "string.pattern.base": "Mã ICD-10 không hợp lệ. VD: A01 hoặc A01.11",
        "any.required": "Mã ICD-10 là bắt buộc",
    }),
    description: Joi.string().optional().max(255).allow(null, "").messages({
        "string.max": "Mô tả quá dài, vui lòng nhập ≤ 255 ký tự",
    }),
});

export const Icd10ResponseSchema = Joi.object<Icd10ResponseDto>({
    code: Joi.string().required(),
    description: Joi.string().allow(null, "").optional(),
});

export const Icd10ListResponseSchema = Joi.object<Icd10ListResponseDto>({
    icd10s: Joi.array()
        .items(Icd10ResponseSchema)
        .description("Danh sách ICD-10"),
    pagination: Joi.object({
        currentPage: Joi.number().description("Trang hiện tại"),
        size: Joi.number().description("Số lượng mỗi trang"),
        totalItems: Joi.number().description("Tổng số bản ghi"),
        totalPages: Joi.number().description("Tổng số trang"),
    })
        .required()
        .description("Thông tin phân trang"),
});
