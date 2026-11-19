import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Chỉ route tĩnh: danh sách phim lấy từ API runtime nên không đưa vào sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/movies"].map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "daily", priority: path ? 0.8 : 1 }));
}
