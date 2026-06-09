import { describe, expect, it } from "vitest";

import {
  getSubscriptionTemplatesForPoint,
  requestSubscriptionForPoint,
  type SubscriptionRequestPoint,
} from "./notificationService";

describe("notification service", () => {
  it("maps product events to WeChat subscription templates", () => {
    const points: SubscriptionRequestPoint[] = ["signup", "waitlist", "juZhang", "feedback"];

    expect(Object.fromEntries(points.map((point) => [point, getSubscriptionTemplatesForPoint(point)]))).toEqual({
      signup: ["activity-reminder-template-id"],
      waitlist: ["waitlist-promotion-template-id"],
      juZhang: ["juzhang-invitation-template-id"],
      feedback: ["feedback-reminder-template-id"],
    });
  });

  it("requests subscription messages through an injectable adapter", async () => {
    const result = await requestSubscriptionForPoint("signup", {
      requestSubscribeMessage: async ({ tmplIds }) => ({
        [tmplIds[0]]: "accept",
      }),
    });

    expect(result).toEqual({
      point: "signup",
      templateIds: ["activity-reminder-template-id"],
      acceptedTemplateIds: ["activity-reminder-template-id"],
    });
  });

  it("returns empty accepted templates when the user declines", async () => {
    const result = await requestSubscriptionForPoint("feedback", {
      requestSubscribeMessage: async ({ tmplIds }) => ({
        [tmplIds[0]]: "reject",
      }),
    });

    expect(result.acceptedTemplateIds).toEqual([]);
  });
});
