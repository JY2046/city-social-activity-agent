import { describe, expect, it } from "vitest";
import { activities, users } from "./mockData";

describe("mock data", () => {
  it("contains paid and free activities for the MVP scenarios", () => {
    expect(activities).toHaveLength(4);
    expect(activities.some((activity) => activity.budgetType === "paid")).toBe(true);
    expect(activities.some((activity) => activity.budgetType === "free")).toBe(true);
  });

  it("lets users choose whether attended event count is visible", () => {
    expect(users.some((user) => user.showAttendedEventCount)).toBe(true);
    expect(users.some((user) => !user.showAttendedEventCount)).toBe(true);
  });
});
