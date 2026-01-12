import Joi from "joi";
import { Session } from "@prisma/client";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface ClinicRequestDto {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  sessions?: ClinicSessionItemDto[];
}

export interface ClinicSessionItemDto {
  sessionType: Session;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface ClinicWorkingSessionDto {
  clinicId: string;
  sessions: ClinicSessionItemDto[];
}

const ClinicSessionItemSchema = Joi.object({
  sessionType: Joi.string().valid("Morning", "Afternoon", "Evening", "Noon").required(),
  startTime: Joi.string().pattern(timeRegex).required(),
  endTime: Joi.string().pattern(timeRegex).required(),
  isActive: Joi.boolean().default(true),
})
  .custom((value, helpers) => {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMinutes(value.endTime) <= toMinutes(value.startTime)) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "Giờ bắt đầu phải sau giờ kết thúc",
  });

export const ClinicRequestSchema = Joi.object({
  sessions: Joi.array()
    .items(ClinicSessionItemSchema)
    .unique("sessionType")
    .custom((value, helpers) => {
      if (!Array.isArray(value) || value.length <= 1) {
        return value;
      }

      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      const ranges = value
        .map((s) => ({
          start: toMinutes(s.startTime),
          end: toMinutes(s.endTime),
        }))
        .sort((a, b) => a.start - b.start);

      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].start < ranges[i - 1].end) {
          return helpers.error("any.invalid");
        }
      }

      return value;
    })
    .messages({
      "any.invalid": "Giờ làm việc các ca không được chồng lấp",
    })
    .optional(),
  clinicName: Joi.string().trim().max(255).required().messages({
    "string.empty": "Tên phòng khám không được để trống",
    "any.required": "Tên phòng khám là trường bắt buộc",
    "string.max": "Tên phòng khám không được vượt quá 255 ký tự",
  }),

  address: Joi.string().trim().max(255).allow(null, "").messages({
    "string.max": "Địa chỉ không được vượt quá 255 ký tự",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^0[0-9]{9,10}$/)
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không đúng định dạng (10-11 số)",
    }),

  email: Joi.string().trim().email().max(150).required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không đúng định dạng",
    "string.max": "Email không được vượt quá 150 ký tự",
  }),
});
