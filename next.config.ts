import type { NextConfig } from "next";

// Lưu ý: với `output: "standalone"`, rewrites được tính lúc BUILD (lưu vào routes-manifest),
// nên BACKEND_URL phải có mặt khi chạy `next build` (Docker: --build-arg BACKEND_URL=...).
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // Bản build tối giản cho Docker (.next/standalone/server.js).
  output: "standalone",
  // Proxy /api/* -> backend Spring Boot để khỏi phải cấu hình CORS khi dev.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
