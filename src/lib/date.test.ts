import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatEndTime, isSalesClosed, next7Days, todayVn, vnDateOf, vnLocalToIso } from "./date";

describe("date helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-03-10 20:00 UTC = 03:00 ngày 11/03 giờ VN
    vi.setSystemTime(new Date("2026-03-10T20:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("formatShowtime shows Asia/Ho_Chi_Minh time", async () => {
    const { formatShowtime } = await import("./date");
    expect(formatShowtime("2026-03-10T13:30:00Z")).toBe("20:30");
    expect(formatShowtime("2026-03-10T18:00:00Z")).toBe("01:00");
  });

  it("formatDate handles ISO and LocalDate", () => {
    expect(formatDate("2026-03-10T18:00:00Z")).toBe("11/03/2026");
    expect(formatDate("2026-03-10")).toBe("10/03/2026");
  });

  it("next7Days returns 7 days starting today in VN tz with labels", () => {
    const days = next7Days();
    expect(days).toHaveLength(7);
    expect(days[0].value).toBe("2026-03-11");
    expect(days[0].label).toBe("Hôm nay");
    expect(days[1].value).toBe("2026-03-12");
    expect(days[1].label).toBe("Th 5 12/03"); // 12/03/2026 là thứ Năm
    expect(days[6].value).toBe("2026-03-17");
    expect(days[4].weekday).toBe("CN"); // 15/03/2026 là Chủ nhật
  });

  it("todayVn / vnDateOf use VN date", () => {
    expect(todayVn()).toBe("2026-03-11");
    expect(vnDateOf("2026-03-10T17:00:00Z")).toBe("2026-03-11");
    expect(vnDateOf("2026-03-10T16:59:00Z")).toBe("2026-03-10");
  });

  it("isSalesClosed closes 15 minutes before start", () => {
    const now = Date.now();
    expect(isSalesClosed(new Date(now + 16 * 60_000).toISOString())).toBe(false);
    expect(isSalesClosed(new Date(now + 14 * 60_000).toISOString())).toBe(true);
    expect(isSalesClosed(new Date(now - 60_000).toISOString())).toBe(true);
  });

  it("vnLocalToIso converts VN local to UTC ISO", () => {
    expect(vnLocalToIso("2026-03-11", "20:30")).toBe("2026-03-11T13:30:00.000Z");
    expect(vnLocalToIso("2026-03-11", "00:15")).toBe("2026-03-10T17:15:00.000Z");
    expect(vnLocalToIso("11/03/2026", "20:30")).toBeNull();
    expect(vnLocalToIso("2026-03-11", "8:30")).toBeNull();
  });

  it("formatEndTime adds the +1 day marker across midnight", () => {
    expect(formatEndTime("2026-03-11T13:30:00Z", 120)).toBe("22:30");
    expect(formatEndTime("2026-03-11T16:00:00Z", 150)).toBe("01:30 (+1 ngày)");
  });
});
