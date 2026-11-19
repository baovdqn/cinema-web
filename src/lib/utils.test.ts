import { describe, expect, it } from "vitest";
import { cn, formatVnd, getPosterUrl, newIdempotencyKey } from "./utils";

describe("utils", () => {
  it("formatVnd formats integer VND", () => {
    expect(formatVnd(90000).replace(/\s/g, " ")).toMatch(/^90\.000\s?₫$/);
    expect(formatVnd(0)).toMatch(/^0\s?₫$/);
  });

  it("getPosterUrl handles null, absolute, data/blob and keys", () => {
    expect(getPosterUrl(null)).toBe("/poster-placeholder.svg");
    expect(getPosterUrl(undefined)).toBe("/poster-placeholder.svg");
    expect(getPosterUrl("https://x.test/a.png")).toBe("https://x.test/a.png");
    expect(getPosterUrl("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
    expect(getPosterUrl("blob:abc")).toBe("blob:abc");
    expect(getPosterUrl("posters/a.jpg")).toMatch(/\/posters\/a\.jpg$/);
  });

  it("cn merges tailwind classes", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });

  it("newIdempotencyKey is unique", () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
  });
});
