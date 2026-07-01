import { describe, expect, it } from "vitest";

import { getActivityFeedPage } from "./activityFeedPagination";

describe("activity feed pagination", () => {
  const activities = Array.from({ length: 12 }, (_, index) => ({ id: `a-${index + 1}` }));

  it("returns the first page and whether more activities remain", () => {
    expect(getActivityFeedPage(activities, 5)).toEqual({
      visibleActivities: activities.slice(0, 5),
      hasMore: true,
      nextVisibleCount: 10,
    });
  });

  it("caps the next visible count at the activity list length", () => {
    expect(getActivityFeedPage(activities, 10)).toEqual({
      visibleActivities: activities.slice(0, 10),
      hasMore: true,
      nextVisibleCount: 12,
    });
  });

  it("does not show a load-more state when all activities are visible", () => {
    expect(getActivityFeedPage(activities, 12)).toEqual({
      visibleActivities: activities,
      hasMore: false,
      nextVisibleCount: 12,
    });
  });
});
