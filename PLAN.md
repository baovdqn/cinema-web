# Kế hoạch Frontend — cinema-web

Mỗi Phase là một đơn vị giao cho 1 agent code. Hoàn thành phase → `typecheck` + `lint` + `build` pass → commit.

## Phase 0 — Khung dự án ✅
- [x] Next.js 15 + TS + Tailwind v4, cấu trúc `features/`
- [x] axios client + JWT interceptor, React Query provider, auth store (zustand persist)
- [x] Types DTO (`src/types/api.ts`), API + hooks cho auth / movies / showtimes / booking
- [x] Route skeleton cho tất cả trang, `AuthGuard`, Header/Footer

## Phase 0.5 — Đồng bộ với backend (CẦN thông tin từ backend)
- [ ] Cập nhật `src/types/api.ts` theo DTO thật (hoặc sinh từ OpenAPI bằng `openapi-typescript`)
- [ ] Sửa các endpoint `// TODO: khớp endpoint` trong `features/*/api.ts`
- [ ] Xác nhận: format phân trang, format lỗi, cơ chế auth (access + refresh token?), CORS
- [ ] (Tuỳ chọn) MSW mock nếu backend chưa chạy được local

## Phase 1 — Auth
- [ ] `/login`: form react-hook-form + `loginSchema`, hiển thị lỗi, đọc `?redirect=` rồi quay lại
- [ ] `/register`: form + `registerSchema`
- [ ] Header: menu user (dropdown), ẩn/hiện theo trạng thái đăng nhập, tránh hydration mismatch
- [ ] (Nếu backend có) refresh token: interceptor retry 1 lần khi 401

## Phase 2 — Duyệt phim
- [ ] Trang chủ: hero banner (phim nổi bật), tab "Đang chiếu" / "Sắp chiếu"
- [ ] `/movies`: search (debounce), filter status/thể loại, phân trang, sync state lên URL search params
- [ ] `/movies/[id]`: poster, info, mô tả, trailer (modal YouTube)
- [ ] Chọn ngày (7 ngày tới) → list suất chiếu nhóm theo rạp → click giờ → `/showtimes/[id]/seats`
- [ ] Skeleton loading, empty state, error state dùng chung

## Phase 3 — Chọn ghế (phần quan trọng nhất)
- [ ] `SeatMap`: lưới theo row/number, màu theo `type` (STANDARD/VIP/COUPLE) và `status` (AVAILABLE/HELD/BOOKED)
- [ ] Toggle chọn ghế qua `useSeatSelection` (tối đa 8), ghế COUPLE chọn theo cặp
- [ ] Màn hình chiếu, legend, responsive (scroll ngang trên mobile)
- [ ] Sidebar tóm tắt: phim, rạp, giờ, ghế đã chọn, tổng tiền
- [ ] "Tiếp tục" → `useCreateBooking` → `/checkout/[bookingId]`; xử lý lỗi 409 (ghế vừa bị người khác giữ) → refetch seats + toast
- [ ] Polling 10s đã có sẵn; nếu backend có WebSocket/SSE thì thay thế

## Phase 4 — Thanh toán & vé
- [ ] `/checkout/[bookingId]`: tóm tắt đơn, countdown theo `expiresAt` (hết giờ → báo & quay lại), chọn phương thức
- [ ] Gọi `pay` → redirect `paymentUrl` (VNPay/MoMo) hoặc trang kết quả
- [ ] `/payment/result`: đọc query params từ cổng thanh toán, hiển thị thành công/thất bại
- [ ] `/my-bookings`: list vé, filter trạng thái, chi tiết vé + QR code (`qrcode.react`), huỷ vé

## Phase 5 — Admin (tuỳ backend)
- [ ] Layout `/admin` + guard role ADMIN
- [ ] CRUD phim, rạp/phòng, suất chiếu; danh sách booking; thống kê doanh thu

## Phase 6 — Hoàn thiện
- [ ] Toast toàn cục (vd. `sonner`), error boundary (`error.tsx`), `loading.tsx` cho từng route
- [ ] SEO metadata cho trang phim, `next/image` cho poster
- [ ] Test: Vitest + Testing Library cho store/component chính; Playwright e2e luồng đặt vé
- [ ] Dockerfile + CI (lint/typecheck/build)
