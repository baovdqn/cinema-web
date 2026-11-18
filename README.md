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

Xem `PLAN.md` cho lộ trình và `CLAUDE.md` cho quy ước code.
