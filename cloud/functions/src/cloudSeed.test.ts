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
    expect(seed.registrations.length).toBeGreaterThan(0);
    expect(seed.registrations.every((item) => item._id && item.activityId && item.userId)).toBe(true);
    expect(seed.settlements).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "a-coffee" })]));
    expect(seed.waitlists).toEqual([]);
    expect(seed.juZhangAssignments).toEqual(
      expect.arrayContaining([expect.objectContaining({ _id: "jz-1", activityId: "a-sushi" })]),
    );
    expect(seed.topicCards).toEqual(
      expect.arrayContaining([expect.objectContaining({ _id: "topic-sushi", activityId: "a-sushi" })]),
    );
  });
});
