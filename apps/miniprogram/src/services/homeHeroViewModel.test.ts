import { describe, expect, it } from "vitest";

import { formatBeijingDateTime } from "./homeHeroViewModel";

describe("home hero view model", () => {
  it("formats current date and time in Beijing time", () => {
    expect(formatBeijingDateTime(new Date("2026-06-11T03:05:00.000Z"))).toBe("6月11日 周四 11:05");
  });
});
