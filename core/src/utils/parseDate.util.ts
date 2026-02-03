import { BaseError } from "./base-error.util";

export const parseDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BaseError(400, "Ngày không hợp lệ");
  }
  return date;
};
