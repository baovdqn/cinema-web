// TODO: đồng bộ các type này với DTO thật của backend.

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type MovieStatus = "NOW_SHOWING" | "COMING_SOON" | "ENDED";

export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl?: string;
  durationMinutes: number;
  genres: string[];
  ageRating?: string;
  releaseDate: string;
  status: MovieStatus;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinema: Cinema;
  roomName: string;
  startTime: string; // ISO
  endTime: string;
  basePrice: number;
}

export type SeatType = "STANDARD" | "VIP" | "COUPLE";
export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED";

export interface Seat {
  id: string;
  row: string; // "A"
  number: number; // 1
  type: SeatType;
  status: SeatStatus;
  price: number;
}

export type BookingStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

export interface Booking {
  id: string;
  showtime: Showtime;
  movie: Pick<Movie, "id" | "title" | "posterUrl">;
  seats: Seat[];
  totalPrice: number;
  status: BookingStatus;
  expiresAt?: string; // thời hạn giữ ghế
  createdAt: string;
}
