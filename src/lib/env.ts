export const env = {
  /** Base URL axios gọi tới. Mặc định "/api" → Next rewrite sang backend (tránh CORS). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  /** Base URL ảnh poster (S3/MinIO), ghép với Movie.posterKey. */
  assetBaseUrl: process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "",
};
