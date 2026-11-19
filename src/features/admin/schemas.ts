import { z } from "zod";
import { MAX_ROWS, MAX_SEATS_PER_ROW } from "./seat-layout";

const num = (msg: string) => z.number({ error: msg });

export const movieSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên phim"),
  durationMinutes: num("Nhập thời lượng (phút)").int("Thời lượng phải là số nguyên").min(1, "Tối thiểu 1 phút").max(600, "Tối đa 600 phút"),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày khởi chiếu"),
  status: z.enum(["COMING_SOON", "NOW_SHOWING", "ENDED"]),
});
export type MovieFormValues = z.infer<typeof movieSchema>;

export const cinemaSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên rạp"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  city: z.string().trim().min(1, "Vui lòng nhập thành phố"),
});
export type CinemaFormValues = z.infer<typeof cinemaSchema>;

export const roomSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên phòng"),
    rows: num("Nhập số hàng").int("Phải là số nguyên").min(1, "Tối thiểu 1 hàng").max(MAX_ROWS, `Tối đa ${MAX_ROWS} hàng`),
    seatsPerRow: num("Nhập số ghế mỗi hàng")
      .int("Phải là số nguyên")
      .min(1, "Tối thiểu 1 ghế")
      .max(MAX_SEATS_PER_ROW, `Tối đa ${MAX_SEATS_PER_ROW} ghế`),
    vipRows: z.array(z.string()),
    lastRowCouple: z.boolean(),
  })
  .refine((d) => !d.lastRowCouple || d.seatsPerRow % 2 === 0, {
    message: "Hàng ghế đôi cần số ghế mỗi hàng là số chẵn",
    path: ["seatsPerRow"],
  });
export type RoomFormValues = z.infer<typeof roomSchema>;

const price = z.number({ error: "Nhập giá vé" }).int("Giá phải là số nguyên").min(1000, "Tối thiểu 1.000đ");
export const showtimeSchema = z.object({
  movieId: z.string().min(1, "Chọn phim"),
  cinemaId: z.string().min(1, "Chọn rạp"),
  roomId: z.string().min(1, "Chọn phòng"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày chiếu"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Chọn giờ chiếu"),
  priceStandard: price,
  priceVip: price,
  priceCouple: price,
});
export type ShowtimeFormValues = z.infer<typeof showtimeSchema>;
