import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useCountdown } from "./use-countdown";

describe("formatCountdown", () => {
  it("formats mm:ss and rounds up partial seconds", () => {
    expect(formatCountdown(8 * 60_000)).toBe("08:00");
    expect(formatCountdown(61_000)).toBe("01:01");
    expect(formatCountdown(59_001)).toBe("01:00");
    expect(formatCountdown(0)).toBe("00:00");
  });
});

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns null without expiresAt", () => {
    const { result } = renderHook(() => useCountdown(undefined));
    expect(result.current).toBeNull();
  });

  it("counts down every second and clamps at 0", () => {
    const { result } = renderHook(() => useCountdown("2026-03-10T10:00:03Z"));
    expect(result.current).toBe(3000);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2000);
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
  });

  it("restarts when expiresAt changes", () => {
    const { result, rerender } = renderHook(({ at }) => useCountdown(at), {
      initialProps: { at: "2026-03-10T10:00:10Z" },
    });
    expect(result.current).toBe(10_000);
    rerender({ at: "2026-03-10T10:01:00Z" });
    expect(result.current).toBe(60_000);
  });
});
