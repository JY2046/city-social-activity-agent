import { describe, expect, it } from "vitest";

import {
  getSubscriptionTemplatesForPoint,
  requestSubscriptionForPoint,
  type SubscriptionRequestPoint,
} from "./notificationService";

describe("notification service", () => {
  it("keeps subscription templates empty until runtime ids are configured", () => {
    const points: SubscriptionRequestPoint[] = ["signup", "waitlist", "juZhang", "feedback"];

    expect(Object.fromEntries(points.map((point) => [point, getSubscriptionTemplatesForPoint(point)]))).toEqual({
      signup: [],
      waitlist: [],
      juZhang: [],
      feedback: [],
    });
  });

  it("requests subscription messages through an injectable adapter with configured template ids", async () => {
    const result = await requestSubscriptionForPoint("signup", {
      signup: ["tmpl_signup"],
      waitlist: [],
      juZhang: [],
      feedback: [],
    }, {
      requestSubscribeMessage: async ({ tmplIds }) => ({
        [tmplIds[0]]: "accept",
      }),
    });

    expect(result).toEqual({
      point: "signup",
      templateIds: ["tmpl_signup"],
      acceptedTemplateIds: ["tmpl_signup"],
    });
  });

  it("skips the native request when no template id is configured", async () => {
    const result = await requestSubscriptionForPoint("signup", {
      requestSubscribeMessage: async () => {
        throw new Error("should not request");
      },
    });

    expect(result).toEqual({
      point: "signup",
      templateIds: [],
      acceptedTemplateIds: [],
    });
  });

  it("returns empty accepted templates when the user declines", async () => {
    const result = await requestSubscriptionForPoint("feedback", {
      signup: [],
      waitlist: [],
      juZhang: [],
      feedback: ["tmpl_feedback"],
    }, {
      requestSubscribeMessage: async ({ tmplIds }) => ({
        [tmplIds[0]]: "reject",
      }),
    });

    expect(result.acceptedTemplateIds).toEqual([]);
  });
});
