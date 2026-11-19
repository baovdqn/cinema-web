// Đồng bộ với backend baovdqn/cinema-booking (docs/03-data-model.md).
// Backend hiện mới có GET /movies (trả entity). Các DTO khác là theo thiết kế trong docs —
// khi backend tách DTO thật thì cập nhật lại file này.
// Quy ước: thời gian là chuỗi ISO UTC, tiền là số nguyên VND.

export type Id = number;

/** Chuẩn phân trang của Spring Data (Page<T>). Hiện backend chưa phân trang. */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Body lỗi chung — TODO: khớp với GlobalExceptionHandler của backend */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// ---------- Identity (backend Phase 2 — chưa có) ----------
export type Role = "CUSTOMER" | "ADMIN";

export interface User {
  id: Id;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ---------- Catalog ----------
export type MovieStatus = "COMING_SOON" | "NOW_SHOWING" | "ENDED";

export interface Movie {
  id: Id;
  title: string;
  durationMinutes: number;
  releaseDate: string; // LocalDate "YYYY-MM-DD"
  posterKey: string | null; // S3 object key, dùng getPosterUrl() để ra URL
  status: MovieStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Cinema {
  id: Id;
  name: string;
  address: string;
  city: string;
}

export interface Room {
  id: Id;
  name: string;
}

export interface Showtime {
  id: Id;
  movieId: Id;
  cinema: Cinema;
  room: Room;
  startTime: string; // ISO UTC
  endTime: string;
}

// ---------- Sơ đồ ghế ----------
export type SeatType = "STANDARD" | "VIP" | "COUPLE";
/** DB lưu 0=AVAILABLE, 1=SOLD; HELD lấy từ Redis. Backend nên map sang chuỗi trong DTO. */
export type SeatStatus = "AVAILABLE" | "HELD" | "SOLD";

export interface ShowtimeSeat {
  seatId: Id;
  seatRow: string; // "A"
  seatNumber: number; // 1
  seatType: SeatType;
  status: SeatStatus;
  price: number;
}

// ---------- Booking ----------
export type BookingStatus = "HELD" | "PAYING" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "FAILED";

export interface BookingSeat {
  seatId: Id;
  seatRow: string;
  seatNumber: number;
  price: number;
}

export interface Booking {
  id: Id;
  showtimeId: Id;
  status: BookingStatus;
  totalAmount: number;
  expiresAt: string; // đếm ngược từ đây, KHÔNG đếm lại từ 8 phút
  seats: BookingSeat[];
  createdAt: string;
  // TODO: backend nên trả kèm để hiển thị tóm tắt
  movie?: Pick<Movie, "id" | "title" | "posterKey">;
  showtime?: Showtime;
}

/** 409 khi giữ ghế: ghế bị người khác giữ, hoặc khách đã có booking đang hoạt động. */
export interface HoldConflict {
  message: string;
  conflictedSeatIds?: Id[];
  activeBooking?: Pick<Booking, "id" | "seats" | "expiresAt">;
}

export interface Ticket {
  id: Id;
  bookingId: Id;
  seatId: Id;
  ticketCode: string; // UUID — nội dung QR
  issuedAt: string;
}

// ---------- Admin (UC9) — FE đề xuất, backend chưa có ----------
// TODO: khớp endpoint với backend (xem bảng "/admin/*" trong docs/backend-contract.md)

export interface MovieInput {
  title: string;
  durationMinutes: number;
  releaseDate: string; // "YYYY-MM-DD"
  status: MovieStatus;
  posterKey: string | null;
}

export interface PosterUploadResult {
  posterKey: string;
}

export interface CinemaInput {
  name: string;
  address: string;
  city: string;
  isActive?: boolean;
}

export interface AdminCinema extends Cinema {
  isActive: boolean;
  roomCount: number;
}

/** Cấu hình sinh sơ đồ ghế khi tạo phòng. Hàng đặt tên A, B, C... */
export interface SeatLayout {
  rows: number;
  seatsPerRow: number;
  /** Các hàng (chữ cái) là ghế VIP. */
  vipRows: string[];
  /** Hàng cuối là ghế đôi (cần seatsPerRow chẵn). */
  lastRowCouple: boolean;
}

export interface RoomInput {
  name: string;
  layout: SeatLayout;
}

export interface RoomUpdate {
  name?: string;
  isActive?: boolean;
}

export interface AdminSeat {
  seatRow: string;
  seatNumber: number;
  seatType: SeatType;
}

export interface AdminRoom {
  id: Id;
  cinemaId: Id;
  name: string;
  isActive: boolean;
  seatCount: number;
  seats: AdminSeat[];
}

export type SeatPrices = Record<SeatType, number>;

export interface ShowtimeInput {
  movieId: Id;
  roomId: Id;
  startTime: string; // ISO UTC
  prices: SeatPrices;
}

export interface AdminShowtime extends Showtime {
  movieTitle: string;
  totalSeats: number;
  soldSeats: number;
  prices: SeatPrices;
}

export interface AdminShowtimeQuery {
  cinemaId?: Id;
  date?: string; // "YYYY-MM-DD" giờ rạp
  movieId?: Id;
}

export interface AdminStats {
  nowShowingMovies: number;
  activeCinemas: number;
  showtimesToday: number;
  confirmedBookings: number;
  revenue: number;
}
