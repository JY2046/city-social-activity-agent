import { describe, expect, it } from "vitest";

import { buildActivityDetailUrl, buildItineraryDetailUrl, readActivityIdParam } from "./activityRouteService";

describe("activity route service", () => {
  it("encodes activity ids in detail urls and decodes router params", () => {
    expect(buildActivityDetailUrl("a&sushi=night")).toBe(
      "/pages/activity-detail/index?activityId=a%26sushi%3Dnight",
    );
    expect(buildItineraryDetailUrl("a&sushi=night")).toBe(
      "/pages/itinerary-detail/index?activityId=a%26sushi%3Dnight",
    );
    expect(readActivityIdParam("a%26sushi%3Dnight")).toBe("a&sushi=night");
  });

  it("falls back to the default activity when route params are missing or malformed", () => {
    expect(readActivityIdParam(undefined)).toBe("a-sushi");
    expect(readActivityIdParam("%E0%A4%A")).toBe("a-sushi");
  });
});
