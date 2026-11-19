# Docker

## Build & chạy riêng

```bash
docker build -t cinema-web \
  --build-arg BACKEND_URL=http://app:8080 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://cinema.example.com \
  .
docker run --rm -p 3000:3000 cinema-web
```

**Quan trọng — mọi cấu hình đều là build-time:**

| Build arg | Mặc định | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Next inline vào bundle lúc build |
| `NEXT_PUBLIC_API_MOCKING` | `disabled` | `enabled` = chạy với MSW, không cần backend |
| `NEXT_PUBLIC_ASSET_BASE_URL` | _(rỗng)_ | Base URL poster (S3/MinIO) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Dùng cho metadata, sitemap, robots |
| `BACKEND_URL` | `http://localhost:8080` | Đích của rewrite `/api/*`. Với `output: "standalone"` rewrites được tính lúc **build**, nên đổi backend = build lại image (đặt `BACKEND_URL` lúc `docker run` KHÔNG có tác dụng) |

Image chạy bằng user không phải root (`nextjs`), `node server.js`, cổng 3000.

## Thêm service `web` vào docker-compose của backend

> Giả định: service backend trong compose của `baovdqn/cinema-booking` tên là `app` và lắng nghe cổng `8080`.
> Nếu tên/cổng khác, sửa `BACKEND_URL` cho khớp.

```yaml
services:
  # ... postgres, redis, app (backend) như hiện có ...

  web:
    build:
      context: ../cinema-web          # đường dẫn tới repo frontend
      args:
        BACKEND_URL: http://app:8080  # tên service backend + cổng trong mạng compose
        NEXT_PUBLIC_API_BASE_URL: /api
        NEXT_PUBLIC_API_MOCKING: disabled
        NEXT_PUBLIC_SITE_URL: http://localhost:3000
    ports:
      - "3000:3000"
    depends_on:
      - app
    restart: unless-stopped
```

Trình duyệt chỉ gọi `http://localhost:3000/api/*`; container `web` proxy sang `app:8080`, nên không cần bật CORS ở backend.
