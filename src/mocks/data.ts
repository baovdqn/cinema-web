// Dữ liệu mẫu cho mock API (MSW). Mọi kiểu lấy từ "@/types/api".
import type { Cinema, Movie, Room, SeatType, Showtime, User } from "@/types/api";

export const MS_MINUTE = 60_000;
export const MS_DAY = 24 * 60 * MS_MINUTE;
/** Giờ rạp: Asia/Ho_Chi_Minh = UTC+7 (không có DST). */
export const ICT_OFFSET_MS = 7 * 60 * MS_MINUTE;

export const HOLD_MINUTES = 8;
export const SALES_CLOSE_MINUTES = 15;

// ---------- Users ----------
export interface SeedUser extends User {
  password: string;
}
export const seedUsers: SeedUser[] = [
  { id: 1, email: "user@cinema.vn", password: "123456", fullName: "Nguyễn Văn An", role: "CUSTOMER" },
  { id: 2, email: "admin@cinema.vn", password: "123456", fullName: "Quản trị viên", role: "ADMIN" },
];

// ---------- Movies ----------
const poster = (slug: string) => `https://picsum.photos/seed/${slug}/400/600`;
const ts = "2026-10-01T00:00:00Z";

const movieSeed: Array<Omit<Movie, "createdAt" | "updatedAt" | "posterKey"> & { slug: string }> = [
  { id: 1, slug: "mai", title: "Mai", durationMinutes: 131, releaseDate: "2026-10-20", status: "NOW_SHOWING" },
  { id: 2, slug: "lat-mat-7", title: "Lật Mặt 7: Một Điều Ước", durationMinutes: 138, releaseDate: "2026-10-25", status: "NOW_SHOWING" },
  { id: 3, slug: "dune-part-two", title: "Dune: Part Two", durationMinutes: 166, releaseDate: "2026-11-01", status: "NOW_SHOWING" },
  { id: 4, slug: "inside-out-2", title: "Inside Out 2", durationMinutes: 96, releaseDate: "2026-11-05", status: "NOW_SHOWING" },
  { id: 5, slug: "dao-pho-piano", title: "Đào, Phở và Piano", durationMinutes: 100, releaseDate: "2026-11-08", status: "NOW_SHOWING" },
  { id: 6, slug: "mua-do", title: "Mưa Đỏ", durationMinutes: 124, releaseDate: "2026-12-05", status: "COMING_SOON" },
  { id: 7, slug: "zootopia-2", title: "Zootopia 2", durationMinutes: 108, releaseDate: "2026-12-12", status: "COMING_SOON" },
  { id: 8, slug: "avatar-fire-and-ash", title: "Avatar: Lửa và Tro tàn", durationMinutes: 190, releaseDate: "2026-12-19", status: "COMING_SOON" },
];

export const seedMovies: Movie[] = movieSeed.map(({ slug, ...m }) => ({
  ...m,
  posterKey: poster(slug),
  createdAt: ts,
  updatedAt: ts,
}));

// ---------- Cinemas & rooms ----------
export const cinemas: Cinema[] = [
  { id: 1, name: "CinemaX Tràng Tiền", address: "24 Hai Bà Trưng, Hoàn Kiếm", city: "Hà Nội" },
  { id: 2, name: "CinemaX Royal City", address: "72A Nguyễn Trãi, Thanh Xuân", city: "Hà Nội" },
  { id: 3, name: "CinemaX Landmark 81", address: "720A Điện Biên Phủ, Bình Thạnh", city: "TP.HCM" },
];

/** Mỗi rạp 2 phòng. roomId = (cinemaId - 1) * 2 + (1|2). */
export const roomsByCinema: Record<number, Room[]> = Object.fromEntries(
  cinemas.map((c) => [
    c.id,
    [1, 2].map((n) => ({ id: (c.id - 1) * 2 + n, name: `Phòng ${n}` })),
  ]),
);

// ---------- Sơ đồ ghế (giống nhau cho mọi phòng) ----------
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const SEATS_PER_ROW = 12;
export const SEAT_PRICE: Record<SeatType, number> = { STANDARD: 75_000, VIP: 95_000, COUPLE: 180_000 };

/** A–C STANDARD, D–I VIP, J COUPLE (ghế ghép đôi 1-2, 3-4, ...). */
export function seatTypeOfRow(row: string): SeatType {
  if (row === "J") return "COUPLE";
  return "ABC".includes(row) ? "STANDARD" : "VIP";
}

export interface SeatTemplate {
  index: number; // 0..119
  seatRow: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
}
export const seatTemplates: SeatTemplate[] = SEAT_ROWS.flatMap((seatRow, r) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => {
    const seatType = seatTypeOfRow(seatRow);
    return { index: r * SEATS_PER_ROW + i, seatRow, seatNumber: i + 1, seatType, price: SEAT_PRICE[seatType] };
  }),
);
export const seatIdOf = (roomId: number, index: number) => roomId * 1000 + index;

// ---------- Showtimes ----------
/** Giờ chiếu (giờ địa phương) — cách nhau 3 tiếng, phim dài nhất ≤ 166 phút nên không chồng suất. */
const SLOT_HOURS = [9, 12, 15, 18, 21];
const nowShowing = seedMovies.filter((m) => m.status === "NOW_SHOWING");

/** 00:00 giờ rạp của hôm nay, tính bằng ms UTC. */
function startOfTodayIct(now: number) {
  return Math.floor((now + ICT_OFFSET_MS) / MS_DAY) * MS_DAY - ICT_OFFSET_MS;
}

export function generateShowtimes(now = Date.now()): Showtime[] {
  const base = startOfTodayIct(now);
  const result: Showtime[] = [];
  let id = 1;
  for (let day = 0; day < 7; day++) {
    for (const cinema of cinemas) {
      const rooms = roomsByCinema[cinema.id];
      SLOT_HOURS.forEach((hour, s) => {
        rooms.forEach((room, r) => {
          const movie = nowShowing[(s * 2 + r + cinema.id + day) % nowShowing.length];
          const start = base + day * MS_DAY + hour * 60 * MS_MINUTE;
          result.push({
            id: id++,
            movieId: movie.id,
            cinema,
            room,
            startTime: new Date(start).toISOString(),
            endTime: new Date(start + movie.durationMinutes * MS_MINUTE).toISOString(),
          });
        });
      });
    }
  }
  return result;
}

/** PRNG có seed (mulberry32) để dữ liệu ổn định giữa các lần reload. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
