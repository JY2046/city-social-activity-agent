import { beforeEach, describe, expect, it } from "vitest";

import { joinWaitlist, resetMockServices, signup } from "./registrationService";
import { createMockUserActivityReadAdapter, loadMyActivityFeed } from "./userActivityService";
import { buildJuZhangWorkspaceItems } from "./juZhangWorkspaceList";

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
        statusLabel: "已报名",
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
});
