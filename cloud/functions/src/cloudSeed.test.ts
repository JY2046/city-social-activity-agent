import { describe, expect, it } from "vitest";

import { createCloudSeedData } from "./cloudSeed";

describe("cloud seed data", () => {
  it("creates importable collection documents for the cold-start database", () => {
    const seed = createCloudSeedData();

    expect(seed.users).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "u-current" })]));
    expect(seed.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: "a-sushi",
          id: "a-sushi",
          city: "上海",
          reviewStatus: "approved",
          coverImagePath: "/assets/images/activity-sushi.jpg",
        }),
      ]),
    );
    expect(seed.registrations.every((item) => item._id && item.activityId && item.userId)).toBe(true);
    expect(seed.settlements).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "a-coffee" })]));
    expect(seed.waitlists).toEqual([]);
  });
});
