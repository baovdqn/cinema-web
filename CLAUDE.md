# cinema-web — Frontend đặt vé xem phim

Frontend cho hệ thống cinema booking. Backend là repo riêng `baovdqn/cinema-booking` (Spring Boot, REST + JWT).
- Kế hoạch: `PLAN.md`
- Hợp đồng API + quy tắc nghiệp vụ (4 ghế, giữ 8 phút, 409, trạng thái booking): `docs/backend-contract.md` — **đọc trước khi code**.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
TanStack Query v5 (server state) · Zustand (client state) · axios · react-hook-form + zod · dayjs.

## Lệnh
- `npm run dev` — dev server (http://localhost:3000)
- `npm run typecheck` · `npm run lint` · `npm run build` — PHẢI pass cả 3 trước khi commit.

## Cấu trúc
- `src/app/` — chỉ routing + ghép component. `(main)` có header/footer, `(auth)` là layout đăng nhập.
- `src/features/<domain>/` — `api.ts` (gọi axios), `hooks.ts` (React Query), `components/`, store riêng nếu cần.
- `src/components/ui/` — UI dùng chung (Button, Input, Spinner...). `components/layout/` — Header/Footer.
- `src/lib/api-client.ts` — axios instance (tự gắn Bearer token, 401 → logout). `getErrorMessage()`, `getErrorStatus()`, `getErrorData()`.
- `next.config.ts` — rewrite `/api/*` → `BACKEND_URL` (mặc định http://localhost:8080).
- `src/stores/auth-store.ts` — token + user (persist localStorage).
- `src/types/api.ts` — DTO dùng chung, đồng bộ với backend.

## Quy ước
- Không gọi `axios`/`fetch` trực tiếp trong component — luôn qua `features/*/api.ts` + hook.
- Query key khai báo trong object `xxxKeys` ở `hooks.ts`.
- Component dùng hook/state phải có `"use client"`. Trang cần đăng nhập bọc `<AuthGuard>`.
- Dùng `cn()` để merge class, `formatVnd()` để hiển thị tiền, `getPosterUrl(posterKey)` cho poster.
- ID là `number` (backend Long/Integer). Thời gian ISO UTC, hiển thị theo `Asia/Ho_Chi_Minh`.
- Giữ ghế và thanh toán luôn gửi header `Idempotency-Key`.
- Text UI tiếng Việt. Theme tối, màu nhấn `red-600`.
- Không thêm thư viện UI lớn (MUI, antd...) khi chưa hỏi.
- Mọi chỗ còn giả định về API backend đều đánh dấu `// TODO: khớp endpoint với backend`.
