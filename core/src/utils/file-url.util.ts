export function resolveFileUrl(relativePath?: string | null): string | null {
  if (!relativePath) return null;
  const base = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return relativePath;
  return `${base}${relativePath}`;
}
