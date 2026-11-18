import { delay, http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import type { Booking, HoldConflict, Ticket } from "@/types/api";
import { HOLD_MINUTES, MS_MINUTE, SALES_CLOSE_MINUTES, seatTemplates } from "../data";
import { db, getSeatState, releaseSeats, sellSeats, sweepExpired, toPublic, type StoredBooking } from "../db";
import { authUser, errorResponse, readDelay, unauthorized } from "../utils";

const base = env.apiBaseUrl;
const PAY_MIN_MS = 30_000;
const PENDING_CONFIRM_MS = 6_000;

type Outcome = "success" | "declined" | "pending";

function issueTickets(b: StoredBooking) {
  if (db.tickets.some((t) => t.bookingId === b.id)) return;
  const issuedAt = new Date().toISOString();
  for (const s of b.seats) {
    db.tickets.push({ id: db.nextTicketId++, bookingId: b.id, seatId: s.seatId, ticketCode: crypto.randomUUID(), issuedAt });
  }
}

function confirm(b: StoredBooking) {
  b.status = "CONFIRMED";
  sellSeats(b);
  issueTickets(b);
}

function findBooking(id: string) {
  return db.bookings.find((b) => b.id === Number(id));
}

export const bookingHandlers = [
  // ---- Giữ ghế ----
  http.post(`${base}/bookings`, async ({ request }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();

    const key = request.headers.get("Idempotency-Key");
    if (!key) return errorResponse(400, "Thiếu header Idempotency-Key");
    const idemKey = `hold:${user.id}:${key}`;
    const prev = db.idempotency.get(idemKey);
    if (prev) {
      const existing = db.bookings.find((b) => b.id === prev.bookingId);
      if (existing) return HttpResponse.json(toPublic(existing), { status: prev.status });
    }

    const body = (await request.json().catch(() => null)) as { showtimeId?: number; seatIds?: number[] } | null;
    const seatIds = Array.isArray(body?.seatIds) ? [...new Set(body.seatIds.map(Number))] : [];
    if (seatIds.length < 1 || seatIds.length > 4) return errorResponse(400, "Chỉ được chọn từ 1 đến 4 ghế");

    const showtime = db.showtimes.find((s) => s.id === Number(body?.showtimeId));
    if (!showtime) return errorResponse(404, "Không tìm thấy suất chiếu");

    const now = Date.now();
    const start = new Date(showtime.startTime).getTime();
    const salesClose = start - SALES_CLOSE_MINUTES * MS_MINUTE;
    if (now > salesClose - PAY_MIN_MS) return errorResponse(409, "Suất này sắp đóng bán vé");

    const templates = seatIds.map((id) => seatTemplates.find((t) => showtime.room.id * 1000 + t.index === id));
    if (templates.some((t) => !t)) return errorResponse(400, "Ghế không thuộc phòng chiếu của suất này");

    const active = db.bookings.find(
      (b) => b.userId === user.id && b.showtimeId === showtime.id && (b.status === "HELD" || b.status === "PAYING"),
    );
    if (active) {
      const conflict: HoldConflict = {
        message: "Bạn đang giữ ghế cho suất chiếu này",
        activeBooking: { id: active.id, seats: active.seats, expiresAt: active.expiresAt },
      };
      return errorResponse(409, conflict.message, { activeBooking: conflict.activeBooking });
    }

    const state = getSeatState(showtime.id);
    const conflicted = seatIds.filter((id) => state.get(id) !== "AVAILABLE");
    if (conflicted.length > 0) {
      const conflict: HoldConflict = { message: "Một số ghế đã được giữ hoặc đã bán", conflictedSeatIds: conflicted };
      return errorResponse(409, conflict.message, { conflictedSeatIds: conflict.conflictedSeatIds });
    }

    const seats = templates.map((t, i) => ({
      seatId: seatIds[i],
      seatRow: t!.seatRow,
      seatNumber: t!.seatNumber,
      price: t!.price,
    }));
    const movie = db.movies.find((m) => m.id === showtime.movieId);
    const booking: StoredBooking = {
      id: db.nextBookingId++,
      userId: user.id,
      showtimeId: showtime.id,
      status: "HELD",
      totalAmount: seats.reduce((sum, s) => sum + s.price, 0),
      expiresAt: new Date(Math.min(now + HOLD_MINUTES * MS_MINUTE, salesClose)).toISOString(),
      seats,
      createdAt: new Date(now).toISOString(),
      movie: movie && { id: movie.id, title: movie.title, posterKey: movie.posterKey },
      showtime,
    };
    for (const id of seatIds) state.set(id, "HELD");
    db.bookings.push(booking);
    db.idempotency.set(idemKey, { status: 201, bookingId: booking.id });
    return HttpResponse.json(toPublic(booking), { status: 201 });
  }),

  // ---- Lịch sử (đặt trước :id để không bị nuốt) ----
  http.get(`${base}/bookings/me`, async ({ request }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();
    const mine: Booking[] = db.bookings
      .filter((b) => b.userId === user.id)
      .sort((a, b) => b.id - a.id)
      .map(toPublic);
    return HttpResponse.json(mine);
  }),

  http.get(`${base}/bookings/:id`, async ({ request, params }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();
    const b = findBooking(String(params.id));
    if (!b) return errorResponse(404, "Không tìm thấy booking");
    if (b.userId !== user.id) return errorResponse(403, "Bạn không có quyền xem booking này");
    return HttpResponse.json(toPublic(b));
  }),

  http.post(`${base}/bookings/:id/cancel`, async ({ request, params }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();
    const b = findBooking(String(params.id));
    if (!b) return errorResponse(404, "Không tìm thấy booking");
    if (b.userId !== user.id) return errorResponse(403, "Bạn không có quyền huỷ booking này");
    if (b.status !== "HELD") return errorResponse(409, `Không thể huỷ booking ở trạng thái ${b.status}`);
    b.status = "CANCELLED";
    releaseSeats(b);
    return HttpResponse.json(toPublic(b));
  }),

  // ---- Thanh toán (giả lập) ----
  http.post(`${base}/bookings/:id/pay`, async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();
    const b = findBooking(String(params.id));
    if (!b) return errorResponse(404, "Không tìm thấy booking");
    if (b.userId !== user.id) return errorResponse(403, "Bạn không có quyền thanh toán booking này");

    const key = request.headers.get("Idempotency-Key");
    if (!key) return errorResponse(400, "Thiếu header Idempotency-Key");
    const idemKey = `pay:${user.id}:${b.id}:${key}`;
    const prev = db.idempotency.get(idemKey);
    if (prev) {
      await readDelay();
      const headers = prev.message ? { "X-Payment-Message": encodeURIComponent(prev.message) } : undefined;
      return HttpResponse.json(toPublic(b), { status: prev.status, headers });
    }

    if (b.status !== "HELD" || db.payInflight.has(b.id)) {
      return errorResponse(409, `Không thể thanh toán booking ở trạng thái ${b.status}`);
    }
    if (new Date(b.expiresAt).getTime() - Date.now() < PAY_MIN_MS) {
      return errorResponse(409, "Không đủ thời gian thanh toán, vui lòng chọn lại ghế");
    }

    const forced = new URL(request.url).searchParams.get("outcome");
    const rand = Math.random();
    const outcome: Outcome =
      forced === "success" || forced === "declined" || forced === "pending"
        ? forced
        : rand < 0.7
          ? "success"
          : rand < 0.85
            ? "declined"
            : "pending";

    db.payInflight.add(b.id);
    await delay(1000 + Math.random() * 1000);
    db.payInflight.delete(b.id);

    let status = 200;
    let message: string | undefined;
    if (outcome === "success") {
      confirm(b);
    } else if (outcome === "declined") {
      message = "Thẻ bị từ chối";
    } else {
      status = 202;
      b.status = "PAYING";
      setTimeout(() => {
        if (b.status === "PAYING") confirm(b);
      }, PENDING_CONFIRM_MS);
    }
    db.idempotency.set(idemKey, { status, bookingId: b.id, message });
    // Booking giữ đúng kiểu `Booking`; lý do bị từ chối nằm ở header X-Payment-Message (đã encodeURIComponent).
    const headers = message ? { "X-Payment-Message": encodeURIComponent(message) } : undefined;
    return HttpResponse.json(toPublic(b), { status, headers });
  }),

  http.get(`${base}/bookings/:id/tickets`, async ({ request, params }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    sweepExpired();
    const b = findBooking(String(params.id));
    if (!b) return errorResponse(404, "Không tìm thấy booking");
    if (b.userId !== user.id) return errorResponse(403, "Bạn không có quyền xem vé của booking này");
    if (b.status !== "CONFIRMED") return errorResponse(409, "Booking chưa được xác nhận, chưa có vé");
    const tickets: Ticket[] = db.tickets.filter((t) => t.bookingId === b.id);
    return HttpResponse.json(tickets);
  }),
];
