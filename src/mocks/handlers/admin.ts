// Mock cho các endpoint /admin/* (FE đề xuất — backend chưa có). Cần token role ADMIN.
// Ghi thẳng vào `db` dùng chung nên thay đổi hiện ngay ở trang khách.
import { delay, http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import { generateSeats, validateLayout } from "@/features/admin/seat-layout";
import type {
  AdminCinema,
  AdminRoom,
  AdminShowtime,
  AdminStats,
  CinemaInput,
  Movie,
  MovieInput,
  MovieStatus,
  RoomInput,
  RoomUpdate,
  SeatPrices,
  Showtime,
  ShowtimeInput,
} from "@/types/api";
import { ICT_OFFSET_MS, MS_MINUTE } from "../data";
import { db, getSeatState, pricesOf, showtimeSeats, sweepExpired, type StoredCinema, type StoredRoom } from "../db";
import { authUser, errorResponse, readDelay, unauthorized } from "../utils";

const base = env.apiBaseUrl;
const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const MOVIE_STATUSES: MovieStatus[] = ["COMING_SOON", "NOW_SHOWING", "ENDED"];

/** 401 nếu chưa đăng nhập, 403 nếu không phải ADMIN, ngược lại null. */
function guard(request: Request) {
  const user = authUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return errorResponse(403, "Bạn không có quyền truy cập");
  return null;
}

const bodyOf = <T>(request: Request) => request.json().catch(() => null) as Promise<T | null>;
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

// ---------- Mappers ----------
const adminCinema = (c: StoredCinema): AdminCinema => ({
  ...c,
  roomCount: db.rooms.filter((r) => r.cinemaId === c.id).length,
});
const adminRoom = (r: StoredRoom): AdminRoom => ({ ...r, seatCount: r.seats.length });

function adminShowtime(s: Showtime): AdminShowtime {
  const state = getSeatState(s.id);
  let sold = 0;
  for (const v of state.values()) if (v === "SOLD") sold++;
  const movie = db.movies.find((m) => m.id === s.movieId);
  return {
    ...s,
    movieTitle: movie?.title ?? `Phim #${s.movieId}`,
    totalSeats: state.size,
    soldSeats: sold,
    prices: pricesOf(s.id),
  };
}

/** Đồng bộ bản sao cinema/room nhúng trong showtime sau khi sửa. */
function syncEmbedded() {
  for (const s of db.showtimes) {
    const c = db.cinemas.find((x) => x.id === s.cinema.id);
    if (c) s.cinema = { id: c.id, name: c.name, address: c.address, city: c.city };
    const r = db.rooms.find((x) => x.id === s.room.id);
    if (r) s.room = { id: r.id, name: r.name };
  }
}

function validateMovie(b: MovieInput | null): string | null {
  if (!b) return "Dữ liệu không hợp lệ";
  if (!nonEmpty(b.title)) return "Tên phim không được để trống";
  if (!isInt(b.durationMinutes) || b.durationMinutes < 1 || b.durationMinutes > 600) return "Thời lượng phải từ 1 đến 600 phút";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.releaseDate ?? "")) return "Ngày khởi chiếu không hợp lệ";
  if (!MOVIE_STATUSES.includes(b.status)) return "Trạng thái phim không hợp lệ";
  return null;
}

function validateCinema(b: CinemaInput | null): string | null {
  if (!b) return "Dữ liệu không hợp lệ";
  if (!nonEmpty(b.name) || !nonEmpty(b.address) || !nonEmpty(b.city)) return "Thiếu tên, địa chỉ hoặc thành phố";
  return null;
}

const ictDate = (iso: string) => new Date(new Date(iso).getTime() + ICT_OFFSET_MS).toISOString().slice(0, 10);

export const adminHandlers = [
  // ---- Thống kê ----
  http.get(`${base}/admin/stats`, async ({ request }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    sweepExpired();
    const today = ictDate(new Date().toISOString());
    const confirmed = db.bookings.filter((b) => b.status === "CONFIRMED");
    const stats: AdminStats = {
      nowShowingMovies: db.movies.filter((m) => m.status === "NOW_SHOWING").length,
      activeCinemas: db.cinemas.filter((c) => c.isActive).length,
      showtimesToday: db.showtimes.filter((s) => ictDate(s.startTime) === today).length,
      confirmedBookings: confirmed.length,
      revenue: confirmed.reduce((sum, b) => sum + b.totalAmount, 0),
    };
    return HttpResponse.json(stats);
  }),

  // ---- Phim ----
  http.get(`${base}/admin/movies`, async ({ request }) => {
    await readDelay();
    return guard(request) ?? HttpResponse.json([...db.movies].sort((a, b) => b.id - a.id));
  }),

  http.post(`${base}/admin/movies`, async ({ request }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const b = await bodyOf<MovieInput>(request);
    const invalid = validateMovie(b);
    if (invalid || !b) return errorResponse(400, invalid ?? "Dữ liệu không hợp lệ");
    const now = new Date().toISOString();
    const movie: Movie = {
      id: db.nextMovieId++,
      title: b.title.trim(),
      durationMinutes: b.durationMinutes,
      releaseDate: b.releaseDate,
      status: b.status,
      posterKey: b.posterKey || null,
      createdAt: now,
      updatedAt: now,
    };
    db.movies.push(movie);
    return HttpResponse.json(movie, { status: 201 });
  }),

  http.put(`${base}/admin/movies/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const movie = db.movies.find((m) => m.id === Number(params.id));
    if (!movie) return errorResponse(404, "Không tìm thấy phim");
    const b = await bodyOf<MovieInput>(request);
    const invalid = validateMovie(b);
    if (invalid || !b) return errorResponse(400, invalid ?? "Dữ liệu không hợp lệ");
    Object.assign(movie, {
      title: b.title.trim(),
      durationMinutes: b.durationMinutes,
      releaseDate: b.releaseDate,
      status: b.status,
      posterKey: b.posterKey || null,
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(movie);
  }),

  http.delete(`${base}/admin/movies/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const id = Number(params.id);
    const idx = db.movies.findIndex((m) => m.id === id);
    if (idx < 0) return errorResponse(404, "Không tìm thấy phim");
    if (db.showtimes.some((s) => s.movieId === id)) {
      return errorResponse(409, "Phim đã có suất chiếu, hãy xoá các suất chiếu trước (hoặc chuyển sang “Đã kết thúc”)");
    }
    db.movies.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Upload poster (multipart) -> posterKey là data URL để hiển thị được ngay ----
  http.post(`${base}/admin/uploads/poster`, async ({ request }) => {
    await delay(300 + Math.random() * 300);
    const denied = guard(request);
    if (denied) return denied;
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return errorResponse(400, "Thiếu file poster");
    if (!file.type.startsWith("image/")) return errorResponse(400, "Poster phải là file ảnh");
    if (file.size > MAX_POSTER_BYTES) return errorResponse(413, "Ảnh quá lớn (tối đa 5MB)");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return HttpResponse.json({ posterKey: `data:${file.type};base64,${btoa(binary)}` }, { status: 201 });
  }),

  // ---- Rạp ----
  http.get(`${base}/admin/cinemas`, async ({ request }) => {
    await readDelay();
    return guard(request) ?? HttpResponse.json(db.cinemas.map(adminCinema));
  }),

  http.post(`${base}/admin/cinemas`, async ({ request }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const b = await bodyOf<CinemaInput>(request);
    const invalid = validateCinema(b);
    if (invalid || !b) return errorResponse(400, invalid ?? "Dữ liệu không hợp lệ");
    const cinema: StoredCinema = {
      id: db.nextCinemaId++,
      name: b.name.trim(),
      address: b.address.trim(),
      city: b.city.trim(),
      isActive: b.isActive ?? true,
    };
    db.cinemas.push(cinema);
    return HttpResponse.json(adminCinema(cinema), { status: 201 });
  }),

  http.put(`${base}/admin/cinemas/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const cinema = db.cinemas.find((c) => c.id === Number(params.id));
    if (!cinema) return errorResponse(404, "Không tìm thấy rạp");
    const b = await bodyOf<CinemaInput>(request);
    const invalid = validateCinema(b);
    if (invalid || !b) return errorResponse(400, invalid ?? "Dữ liệu không hợp lệ");
    Object.assign(cinema, {
      name: b.name.trim(),
      address: b.address.trim(),
      city: b.city.trim(),
      isActive: b.isActive ?? cinema.isActive,
    });
    syncEmbedded();
    return HttpResponse.json(adminCinema(cinema));
  }),

  http.delete(`${base}/admin/cinemas/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const cinema = db.cinemas.find((c) => c.id === Number(params.id));
    if (!cinema) return errorResponse(404, "Không tìm thấy rạp");
    cinema.isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Phòng ----
  http.get(`${base}/admin/cinemas/:id/rooms`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const id = Number(params.id);
    if (!db.cinemas.some((c) => c.id === id)) return errorResponse(404, "Không tìm thấy rạp");
    return HttpResponse.json(db.rooms.filter((r) => r.cinemaId === id).map(adminRoom));
  }),

  http.post(`${base}/admin/cinemas/:id/rooms`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const cinemaId = Number(params.id);
    if (!db.cinemas.some((c) => c.id === cinemaId)) return errorResponse(404, "Không tìm thấy rạp");
    const b = await bodyOf<RoomInput>(request);
    if (!b || !nonEmpty(b.name) || !b.layout) return errorResponse(400, "Thiếu tên phòng hoặc sơ đồ ghế");
    const layoutError = validateLayout(b.layout);
    if (layoutError) return errorResponse(400, layoutError);
    const name = b.name.trim();
    if (db.rooms.some((r) => r.cinemaId === cinemaId && r.name.toLowerCase() === name.toLowerCase())) {
      return errorResponse(409, "Rạp đã có phòng trùng tên");
    }
    const room: StoredRoom = { id: db.nextRoomId++, cinemaId, name, isActive: true, seats: generateSeats(b.layout) };
    db.rooms.push(room);
    return HttpResponse.json(adminRoom(room), { status: 201 });
  }),

  http.patch(`${base}/admin/rooms/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const room = db.rooms.find((r) => r.id === Number(params.id));
    if (!room) return errorResponse(404, "Không tìm thấy phòng");
    const b = await bodyOf<RoomUpdate>(request);
    if (!b) return errorResponse(400, "Dữ liệu không hợp lệ");
    if (b.name !== undefined) {
      if (!nonEmpty(b.name)) return errorResponse(400, "Tên phòng không được để trống");
      room.name = b.name.trim();
    }
    if (typeof b.isActive === "boolean") room.isActive = b.isActive;
    syncEmbedded();
    return HttpResponse.json(adminRoom(room));
  }),

  http.delete(`${base}/admin/rooms/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const room = db.rooms.find((r) => r.id === Number(params.id));
    if (!room) return errorResponse(404, "Không tìm thấy phòng");
    room.isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Suất chiếu ----
  http.get(`${base}/admin/showtimes`, async ({ request }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    sweepExpired();
    const q = new URL(request.url).searchParams;
    const cinemaId = q.get("cinemaId");
    const movieId = q.get("movieId");
    const date = q.get("date");
    const list = db.showtimes
      .filter(
        (s) =>
          (!cinemaId || s.cinema.id === Number(cinemaId)) &&
          (!movieId || s.movieId === Number(movieId)) &&
          (!date || ictDate(s.startTime) === date),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(adminShowtime);
    return HttpResponse.json(list);
  }),

  http.post(`${base}/admin/showtimes`, async ({ request }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    const b = await bodyOf<ShowtimeInput>(request);
    if (!b) return errorResponse(400, "Dữ liệu không hợp lệ");
    const movie = db.movies.find((m) => m.id === Number(b.movieId));
    if (!movie) return errorResponse(404, "Không tìm thấy phim");
    if (movie.status === "ENDED") return errorResponse(400, "Phim đã kết thúc, không thể thêm suất chiếu");
    const room = db.rooms.find((r) => r.id === Number(b.roomId));
    if (!room) return errorResponse(404, "Không tìm thấy phòng");
    const cinema = db.cinemas.find((c) => c.id === room.cinemaId);
    if (!cinema || !cinema.isActive || !room.isActive) return errorResponse(409, "Rạp hoặc phòng đã ngừng hoạt động");

    const startMs = new Date(b.startTime).getTime();
    if (!Number.isFinite(startMs)) return errorResponse(400, "Giờ bắt đầu không hợp lệ");
    if (startMs <= Date.now()) return errorResponse(400, "Giờ bắt đầu phải ở tương lai");

    const prices = b.prices as Partial<SeatPrices> | undefined;
    if (!prices || !(["STANDARD", "VIP", "COUPLE"] as const).every((t) => isInt(prices[t]) && prices[t]! > 0)) {
      return errorResponse(400, "Giá vé phải là số nguyên dương cho cả 3 loại ghế");
    }

    const endMs = startMs + movie.durationMinutes * MS_MINUTE;
    const overlap = db.showtimes.some(
      (s) => s.room.id === room.id && startMs < new Date(s.endTime).getTime() && endMs > new Date(s.startTime).getTime(),
    );
    if (overlap) return errorResponse(409, "Phòng đã có suất chiếu trong khung giờ này");

    const showtime: Showtime = {
      id: db.nextShowtimeId++,
      movieId: movie.id,
      cinema: { id: cinema.id, name: cinema.name, address: cinema.address, city: cinema.city },
      room: { id: room.id, name: room.name },
      startTime: new Date(startMs).toISOString(),
      endTime: new Date(endMs).toISOString(),
    };
    db.showtimes.push(showtime);
    db.showtimePrices.set(showtime.id, { STANDARD: prices.STANDARD!, VIP: prices.VIP!, COUPLE: prices.COUPLE! });
    // Backend sinh showtime_seat: mọi ghế AVAILABLE
    db.seatState.set(showtime.id, new Map(showtimeSeats(showtime).map((s) => [s.seatId, "AVAILABLE" as const])));
    return HttpResponse.json(adminShowtime(showtime), { status: 201 });
  }),

  http.delete(`${base}/admin/showtimes/:id`, async ({ request, params }) => {
    await readDelay();
    const denied = guard(request);
    if (denied) return denied;
    sweepExpired();
    const id = Number(params.id);
    const idx = db.showtimes.findIndex((s) => s.id === id);
    if (idx < 0) return errorResponse(404, "Không tìm thấy suất chiếu");
    const sold = adminShowtime(db.showtimes[idx]).soldSeats;
    if (sold > 0) return errorResponse(409, `Suất chiếu đã bán ${sold} ghế, không thể xoá`);
    for (const b of db.bookings) {
      if (b.showtimeId === id && (b.status === "HELD" || b.status === "PAYING")) b.status = "CANCELLED";
    }
    db.showtimes.splice(idx, 1);
    db.seatState.delete(id);
    db.showtimePrices.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),
];

