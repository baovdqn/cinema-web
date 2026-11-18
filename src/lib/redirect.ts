/** Chỉ chấp nhận đường dẫn nội bộ ("/..." và không phải "//...") để tránh open redirect. */
export function safeRedirect(value: string | null | undefined, fallback = "/") {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return fallback;
}
