import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("allows internal paths", () => {
    expect(safeRedirect("/my-bookings")).toBe("/my-bookings");
    expect(safeRedirect("/movies?x=1#a")).toBe("/movies?x=1#a");
  });
  it("rejects external / protocol-relative / backslash / empty", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("/\\evil.com")).toBe("/");
    expect(safeRedirect("javascript:alert(1)")).toBe("/");
    expect(safeRedirect("")).toBe("/");
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(undefined, "/login")).toBe("/login");
  });
});
