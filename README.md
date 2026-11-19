# cinema-web

Frontend đặt vé xem phim — Next.js 15 + TypeScript + Tailwind.

```bash
cp .env.example .env.local   # sửa NEXT_PUBLIC_API_BASE_URL trỏ tới backend
npm install
npm run dev
```

Mock API (MSW) bật mặc định qua `NEXT_PUBLIC_API_MOCKING=enabled` trong `.env.local` — không cần backend.
Tài khoản test (mật khẩu `123456`): `user@cinema.vn` (khách), `admin@cinema.vn` (admin).
Ép kết quả thanh toán: `?outcome=success|declined|pending` (xem `docs/backend-contract.md`).

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server http://localhost:3000 |
| `npm run build` / `npm start` | Build production / chạy bản build |
| `npm run typecheck` · `npm run lint` | Kiểm tra TypeScript / ESLint |
| `npm test` · `npm run test:watch` | Unit test (Vitest + Testing Library) |
| `npm run test:e2e` | E2E Playwright (tự chạy `next dev -p 3100` với mock bật) |

### E2E
Lần đầu cần trình duyệt: `npx playwright install chromium`. Nếu máy đã có sẵn Chromium không khớp phiên bản Playwright,
trỏ tới nó bằng `PLAYWRIGHT_CHROMIUM_PATH=/đường/dẫn/chromium npm run test:e2e`. Thêm `-- --trace on` khi cần debug,
báo cáo HTML ở `playwright-report/` (`npx playwright show-report`).

## Mock API

Đặt `NEXT_PUBLIC_API_MOCKING=enabled` (trong `.env.local`) để chạy hoàn toàn bằng MSW, không cần backend; bỏ biến này
(hoặc đặt giá trị khác) rồi restart dev server để gọi backend thật qua proxy `/api` → `BACKEND_URL`. Trạng thái mock nằm
trong bộ nhớ trình duyệt, reload là reset.

## Docker

```bash
docker build -t cinema-web --build-arg BACKEND_URL=http://app:8080 .
docker run --rm -p 3000:3000 cinema-web
```

`NEXT_PUBLIC_*` và `BACKEND_URL` là build-time (build arg). Chi tiết và cách thêm service `web` vào docker-compose
của backend: [`docs/docker.md`](docs/docker.md).

## Biến môi trường
Xem `.env.example`. Thêm `NEXT_PUBLIC_SITE_URL` (mặc định `http://localhost:3000`) cho metadata/sitemap.

Xem `PLAN.md` cho lộ trình và `CLAUDE.md` cho quy ước code.
