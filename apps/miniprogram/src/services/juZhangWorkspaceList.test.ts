import { beforeEach, describe, expect, it } from "vitest";

import { acceptJuZhang } from "./juZhangService";
import { joinWaitlist, resetMockServices, signup } from "./registrationService";
import { createMockUserActivityReadAdapter, loadMyActivityFeed } from "./userActivityService";
import { buildJuZhangWorkspaceItems, buildJuZhangWorkspaceListContext } from "./juZhangWorkspaceList";

describe("ju zhang workspace list", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("mirrors the activities from the current user's itinerary feed", async () => {
    signup("a-coffee", { willingToBeJuZhang: true });
    signup("a-bar", { willingToBeJuZhang: false });
    joinWaitlist("a-coffee", "juZhang");

    const itinerary = await loadMyActivityFeed(createMockUserActivityReadAdapter());

    expect(itinerary.status).toBe("ready");
    if (itinerary.status !== "ready") {
      throw new Error("expected itinerary to load");
    }

    const items = buildJuZhangWorkspaceItems(itinerary.items);

    expect(items.map((item) => item.activity.id)).toEqual(itinerary.items.map((item) => item.activity.id));
    expect(items).toEqual([
      expect.objectContaining({
        activity: expect.objectContaining({ id: "a-coffee" }),
        registration: expect.objectContaining({ willingToBeJuZhang: true }),
        statusLabel: "局长排队中",
        juZhangLabel: "已在局长候选队列",
        canOpenWorkspace: true,
      }),
      expect.objectContaining({
        activity: expect.objectContaining({ id: "a-bar" }),
        registration: expect.objectContaining({ status: "waitlisted", willingToBeJuZhang: false }),
        statusLabel: "排队中",
        juZhangLabel: "活动候补中",
        canOpenWorkspace: true,
      }),
    ]);
  });

  it("marks a current user's accepted ju zhang activity as managed in the workspace list", async () => {
    signup("a-coffee", { willingToBeJuZhang: true });
    const assignment = acceptJuZhang("a-coffee");

    const itinerary = await loadMyActivityFeed(createMockUserActivityReadAdapter());

    expect(itinerary.status).toBe("ready");
    if (itinerary.status !== "ready") {
      throw new Error("expected itinerary to load");
    }

    const items = buildJuZhangWorkspaceItems(itinerary.items, { assignments: [assignment] });

    expect(items).toEqual([
      expect.objectContaining({
        activity: expect.objectContaining({ id: "a-coffee" }),
        statusLabel: "已担任局长",
        juZhangLabel: "已担任局长",
        canOpenWorkspace: true,
      }),
    ]);
  });

  it("builds list context from loaded ju zhang workspaces", () => {
    const context = buildJuZhangWorkspaceListContext([
      {
        currentUserId: "u-current",
        assignment: {
          id: "jz-a-coffee-u-current",
          activityId: "a-coffee",
          candidateUserId: "u-current",
          status: "accepted",
          volunteered: true,
        },
        juZhangWaitlistEntry: undefined,
        activeRegistrations: [],
        tasks: [],
      },
      {
        currentUserId: "u-current",
        assignment: undefined,
        juZhangWaitlistEntry: {
          id: "w-a-sushi-juZhang-u-current",
          activityId: "a-sushi",
          userId: "u-current",
          type: "juZhang",
          order: 1,
          status: "waiting",
        },
        activeRegistrations: [],
        tasks: [],
      },
    ]);

    expect(context.assignments).toEqual([
      expect.objectContaining({ activityId: "a-coffee", candidateUserId: "u-current", status: "accepted" }),
    ]);
    expect(context.waitlistEntries).toEqual([
      expect.objectContaining({ activityId: "a-sushi", type: "juZhang", status: "waiting" }),
    ]);
    expect(context.currentUserId).toBe("u-current");
  });
});
