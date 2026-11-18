# Hợp đồng API với backend

Backend: **baovdqn/cinema-booking** — Spring Boot + PostgreSQL + Redis, port `8080`, không có context-path.
Nguồn: `docs/01-requirements.md`, `docs/03-data-model.md`, `docs/cinema-booking-roadmap.md` bên repo backend.
FE gọi `/api/*`, Next rewrite sang `BACKEND_URL` (xem `next.config.ts`).

## Trạng thái endpoint

| Endpoint | Backend | FE dùng ở |
|---|---|---|
| `GET /movies` → `Movie[]` (entity, chưa filter/phân trang) | ✅ có | `features/movies/api.ts` |
| `GET /movies/{id}` | ❌ chưa | trang chi tiết phim |
| `GET /showtimes?movieId=&date=YYYY-MM-DD` | 🚧 Phase 1 | trang chi tiết phim |
| `GET /showtimes/{id}`, `GET /showtimes/{id}/seats` | 🚧 Phase 1 / 4a | trang chọn ghế |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | ❌ Phase 2 | auth |
| `POST /bookings` (header `Idempotency-Key`) | ❌ Phase 4b | giữ ghế |
| `GET /bookings/{id}`, `POST /bookings/{id}/cancel` | ❌ Phase 4b/4d | checkout |
| `POST /bookings/{id}/pay` (header `Idempotency-Key`) | ❌ Phase 4c | checkout |
| `GET /bookings/me`, `GET /bookings/{id}/tickets` | ❌ Phase 4e | vé của tôi |

Tên endpoint ❌/🚧 là FE đề xuất — khi backend làm xong thì sửa lại cho khớp.

## Quy tắc nghiệp vụ FE phải phản ánh
- Tối đa **4 ghế**/lần, 1 suất. Giữ ghế all-or-nothing, **8 phút**, không gia hạn.
- `expiresAt = min(lúc giữ + 8', startTime − 15')` → đếm ngược **từ `expiresAt`** (reload vẫn tiếp tục). Cảnh báo ở mốc 2' và 1'.
- Còn < 30 giây: không cho thanh toán (backend trả `409`) → disable nút, "Không đủ thời gian thanh toán, vui lòng chọn lại ghế".
- Đóng bán 15' trước giờ chiếu.
- Mỗi khách tối đa 1 booking `HELD`/`PAYING` trong 1 suất → `409` kèm booking cũ: "Bạn đang giữ A1, A2…" + **Tiếp tục thanh toán** / **Đổi ghế** (huỷ rồi chọn lại, có xác nhận).
- `409` vì ghế bị người khác giữ → tô lại các ghế đó trên sơ đồ ngay.
- Thời gian lưu UTC, hiển thị theo giờ rạp (`Asia/Ho_Chi_Minh`). Tiền VND số nguyên.
- Không có realtime ở MVP1 → poll sơ đồ ghế.

## Trạng thái booking → UI
| Status | Hiển thị |
|---|---|
| `HELD` | Màn thanh toán + đếm ngược |
| `PAYING` | "Đang xác nhận thanh toán. Vui lòng không thanh toán lại…", poll 3s |
| `CONFIRMED` | Vé QR (`ticket.ticketCode`) |
| `HELD` sau khi bị từ chối | "Thẻ bị từ chối", cho thử lại (nếu còn ≥ 30s) |
| `EXPIRED` / `CANCELLED` | Thông báo + nút chọn lại ghế |
| `FAILED` | "Không thể giữ ghế cho bạn. Giao dịch đã được hủy, bạn sẽ không bị mất tiền" |

## Việc nên đề xuất cho backend
- Trả DTO thay vì entity; ghế trả `status` dạng chuỗi `AVAILABLE|HELD|SOLD` (DB đang là 0/1 + Redis).
- `Movie` hiện chưa có mô tả, thể loại, trailer. Poster là `posterKey` (S3) → cần base URL hoặc presigned URL.
- Body lỗi thống nhất `{ status, message, code }`; `409` giữ ghế kèm `conflictedSeatIds` / `activeBooking`.
- Bật CORS cho `http://localhost:3000` (hoặc giữ proxy của Next).

## Mock (MSW)
Khi `NEXT_PUBLIC_API_MOCKING=enabled`, trình duyệt chạy MSW (`src/mocks/`) và chặn mọi endpoint ở bảng trên (kể cả `GET /movies`); trạng thái nằm trong bộ nhớ, reload là reset. Tắt: bỏ biến này (hoặc đặt khác `enabled`) rồi restart `npm run dev`.

Tài khoản test (mật khẩu `123456`): `user@cinema.vn` (CUSTOMER), `admin@cinema.vn` (ADMIN). Token giả: `mock-token-<userId>`.

- `POST /bookings/{id}/pay?outcome=success|declined|pending` ép kết quả (mặc định ngẫu nhiên 70% / 15% / 15%): `success` → 200 `CONFIRMED`; `declined` → 200 vẫn `HELD` (lý do "Thẻ bị từ chối" ở header `X-Payment-Message`, URL-encoded); `pending` → 202 `PAYING`, ~6 giây sau tự thành `CONFIRMED`. Cùng `Idempotency-Key` trả lại đúng kết quả cũ. `bookingApi.pay(id, key, outcome?)` có tham số tuỳ chọn này.
- Hold hết hạn xử lý lười (khi đọc booking/ghế). Dữ liệu ghế SOLD/HELD ban đầu sinh theo seed nên ổn định giữa các lần reload.
