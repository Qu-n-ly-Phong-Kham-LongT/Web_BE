import path from "path";

export const formatFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);

  const safeName = name
    .normalize("NFD") // tách unicode
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_ ]/g, "") // bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${safeName}-${Date.now()}${ext}`;
};
