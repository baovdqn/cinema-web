import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

export const CINEMA_TZ = "Asia/Ho_Chi_Minh";
const SALES_CLOSE_MINUTES = 15;

/** "HH:mm" theo giờ rạp. */
export function formatShowtime(iso: string) {
  return dayjs(iso).tz(CINEMA_TZ).format("HH:mm");
}

/** "DD/MM/YYYY" theo giờ rạp (LocalDate "YYYY-MM-DD" cũng dùng được). */
export function formatDate(iso: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return dayjs(iso).format("DD/MM/YYYY");
  return dayjs(iso).tz(CINEMA_TZ).format("DD/MM/YYYY");
}

/** 7 ngày tính từ hôm nay (giờ VN). */
export function next7Days(): { value: string; label: string; weekday: string; day: string }[] {
  const today = dayjs().tz(CINEMA_TZ).startOf("day");
  return Array.from({ length: 7 }, (_, i) => {
    const d = today.add(i, "day");
    const dow = d.day();
    const weekday = i === 0 ? "Hôm nay" : dow === 0 ? "CN" : `Th ${dow + 1}`;
    return {
      value: d.format("YYYY-MM-DD"),
      label: i === 0 ? "Hôm nay" : `${weekday} ${d.format("DD/MM")}`,
      weekday,
      day: d.format("DD/MM"),
    };
  });
}

/** Đóng bán 15 phút trước giờ chiếu. */
export function isSalesClosed(startTime: string) {
  return dayjs().isAfter(dayjs(startTime).subtract(SALES_CLOSE_MINUTES, "minute"));
}
