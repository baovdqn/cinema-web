# Kế hoạch Frontend — cinema-web

Backend: `baovdqn/cinema-booking` (Spring Boot). Hợp đồng API + quy tắc nghiệp vụ: **`docs/backend-contract.md`** — đọc trước khi code.
Backend đang ở Phase 1 (Catalog), mới có `GET /movies`. FE đi trước nên các phase cần API chưa có sẽ dùng **mock (MSW)**.

Mỗi Phase giao cho 1 agent code. Xong phase → `typecheck` + `lint` + `build` pass → commit.

## Phase 0 — Khung dự án ✅
- [x] Next.js 15 + TS + Tailwind v4, cấu trúc `features/`
- [x] axios client + JWT interceptor, proxy `/api` → backend, React Query, auth store
- [x] Types theo data model backend, API + hooks cho auth / movies / showtimes / booking
- [x] Route skeleton, `AuthGuard`, Header/Footer

## Phase 1 — Mock API (MSW) ✅
- [x] Cài `msw`, bật bằng `NEXT_PUBLIC_API_MOCKING=enabled` (chỉ dev, browser worker)
- [x] Handlers cho mọi endpoint ❌/🚧 trong `docs/backend-contract.md` (passthrough `GET /movies` nếu backend chạy)
- [x] Dữ liệu mẫu: ~8 phim, 3 rạp, phòng 10 hàng × 12 ghế (hàng cuối COUPLE, giữa VIP), suất chiếu 7 ngày tới
- [x] Mô phỏng: 409 ghế bị giữ, 409 đã có booking active, hold hết hạn 8', pay ngẫu nhiên 200 / 202 PAYING / từ chối

## Phase 2 — Auth (UC1) ✅
- [x] `/login`: react-hook-form + `loginSchema` + `useLogin`, đọc `?redirect=`
- [x] `/register`: `registerSchema` + `useRegister`
- [x] Header: menu user, tránh hydration mismatch với zustand persist
- [x] Link "Admin" khi `role === "ADMIN"`

## Phase 3 — Duyệt phim (UC2, UC3) ✅
- [x] Trang chủ: hero (phim nổi bật) + tab "Đang chiếu" / "Sắp chiếu"
- [x] `/movies`: search tên (client-side), filter status, sync URL search params
- [x] `/movies/[id]`: poster, info. Chọn ngày (7 ngày tới) → suất chiếu nhóm theo rạp, giờ hiển thị theo `Asia/Ho_Chi_Minh` (dayjs + timezone plugin)
- [x] Ẩn/disable suất đã đóng bán (< 15' trước giờ chiếu)
- [x] Skeleton / empty / error state dùng chung

## Phase 4 — Sơ đồ ghế & giữ ghế (UC4, UC5) — quan trọng nhất ✅
- [x] `SeatMap`: lưới theo `seatRow`/`seatNumber`, màu theo `seatType` và `status` (AVAILABLE/HELD/SOLD), màn hình, legend, scroll ngang mobile
- [x] Chọn tối đa 4 ghế (`useSeatSelection`), ghế COUPLE chọn theo cặp
- [x] Sidebar: phim, rạp, giờ, ghế, tổng tiền (`formatVnd`)
- [x] "Giữ ghế" → `useHoldSeats` → `/checkout/[bookingId]`
- [x] Xử lý 409: (a) ghế bị chiếm → tô lại ghế + bỏ khỏi selection; (b) booking active → dialog "Tiếp tục thanh toán" / "Đổi ghế"
- [x] Polling 10s (đã có)

## Phase 5 — Thanh toán (UC6, UC8) ✅
- [x] `/checkout/[bookingId]`: tóm tắt, đếm ngược từ `expiresAt`, cảnh báo 2' và 1', < 30s disable nút
- [x] Thanh toán: 1 `Idempotency-Key` cho mỗi lần bấm (giữ nguyên khi retry do mạng), xử lý 200/202/409
- [x] UI theo bảng trạng thái booking trong `docs/backend-contract.md` (PAYING poll 3s đã có trong `useBooking`)
- [x] Nút "Huỷ giữ ghế" (UC8) có xác nhận

## Phase 6 — Vé & lịch sử (UC7)
- [x] `/my-bookings`: list, filter trạng thái
- [x] Chi tiết booking CONFIRMED: vé QR từng ghế (`qrcode.react`, nội dung `ticketCode`)

## Phase 7 — Admin (UC9) ✅
- [x] Layout `/admin` + guard `role === "ADMIN"`
- [x] CRUD phim (upload poster), rạp, phòng (+ sơ đồ ghế), suất chiếu

## Phase 8 — Hoàn thiện ✅
- [x] Toast (component tự viết `components/ui/toast.tsx`, góc dưới phải), `error.tsx`, `loading.tsx`
- [x] SEO metadata (root, từng trang, `generateMetadata` trang phim, robots, sitemap)
- [x] Vitest cho store/logic đếm ngược; Playwright e2e luồng đặt vé (chạy với MSW)
- [x] Dockerfile, thêm service `web` vào docker-compose của backend (tuỳ chọn) — xem `docs/docker.md`
- [x] CI GitHub Actions (typecheck, lint, test, build, e2e)
