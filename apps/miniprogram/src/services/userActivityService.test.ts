import { beforeEach, describe, expect, it } from "vitest";

import { resetMockServices, signup } from "./registrationService";
import {
  createMockUserActivityReadAdapter,
  loadMyActivityFeed,
  loadMyRegistrationForActivity,
} from "./userActivityService";

describe("user activity service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("loads the current user's registration for a specific activity", async () => {
    signup("a-coffee", { willingToBeJuZhang: true });

    await expect(loadMyRegistrationForActivity("a-coffee", createMockUserActivityReadAdapter())).resolves.toMatchObject({
      status: "ready",
      registration: {
        activityId: "a-coffee",
        status: "confirmed",
        willingToBeJuZhang: true,
      },
    });
  });

  it("loads only current-user itinerary activities from active and waitlisted registrations", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });
    signup("a-bar", { willingToBeJuZhang: false });

    await expect(loadMyActivityFeed(createMockUserActivityReadAdapter())).resolves.toMatchObject({
      status: "ready",
      items: [
        {
          registration: { activityId: "a-coffee", status: "confirmed" },
          activity: { id: "a-coffee" },
        },
        {
          registration: { activityId: "a-bar", status: "waitlisted" },
          activity: { id: "a-bar" },
        },
      ],
    });
  });
});
