import { beforeEach, describe, expect, it, vi } from "vitest";

import { getActivity } from "./activityService";
import {
  createMockActivityReadAdapter,
  loadActivityDetail,
  loadActivityFeed,
  type ActivityReadAdapter,
} from "./activityReadService";
import { resetMockServices } from "./registrationService";

describe("activity read service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("loads the mock activity feed through the async read boundary", async () => {
    await expect(loadActivityFeed(createMockActivityReadAdapter())).resolves.toMatchObject({
      status: "ready",
      activities: expect.arrayContaining([expect.objectContaining({ id: "a-sushi" })]),
    });
  });

  it("loads activity detail through the async read boundary", async () => {
    await expect(loadActivityDetail("a-sushi", createMockActivityReadAdapter())).resolves.toMatchObject({
      status: "ready",
      activity: expect.objectContaining({ id: "a-sushi", title: "周五下班日料小局" }),
    });
  });

  it("returns an empty state when a detail record is missing", async () => {
    await expect(loadActivityDetail("missing", createMockActivityReadAdapter())).resolves.toEqual({
      status: "empty",
      activity: undefined,
    });
  });

  it("returns an error state when the adapter fails", async () => {
    const adapter: ActivityReadAdapter = {
      listActivities: vi.fn(async () => {
        throw new Error("cloud unavailable");
      }),
      getActivity: vi.fn(async () => getActivity("a-sushi")),
    };

    await expect(loadActivityFeed(adapter)).resolves.toEqual({
      status: "error",
      message: "cloud unavailable",
      activities: [],
    });
  });
});
