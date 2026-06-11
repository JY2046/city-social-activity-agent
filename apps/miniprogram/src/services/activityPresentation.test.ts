import { describe, expect, it } from "vitest";

import type { Registration } from "@city-social/domain";

import { getActivity } from "./activityService";
import {
  formatActivityDateTime,
  getActivityCtaLabel,
  getActivityCtaState,
  getActivityStatusLabel,
  getActivityTypeLabel,
  getCostLabel,
} from "./activityPresentation";

describe("activity presentation helpers", () => {
  it("formats activity type labels for the mini program UI", () => {
    expect(getActivityTypeLabel("dinner")).toBe("饭局");
    expect(getActivityTypeLabel("coffee")).toBe("咖啡");
    expect(getActivityTypeLabel("bar")).toBe("酒吧");
    expect(getActivityTypeLabel("walk")).toBe("免费散步");
  });

  it("formats date, cost, status and CTA labels", () => {
    const sushi = getActivity("a-sushi")!;
    const walk = getActivity("a-walk")!;
    const bar = getActivity("a-bar")!;

    expect(formatActivityDateTime(sushi.startsAt)).toBe("6月5日 19:30");
    expect(getCostLabel(sushi)).toBe("约 168 元");
    expect(getCostLabel(walk)).toBe("免费");
    expect(getActivityStatusLabel(sushi)).toBe("已成局");
    expect(getActivityCtaLabel(sushi)).toBe("查看活动");
    expect(getActivityCtaLabel(bar)).toBe("排队候补");
  });

  it("prioritizes the current user's registration state for feed CTAs", () => {
    const sushi = getActivity("a-sushi")!;
    const registration: Registration = {
      id: "r-current",
      userId: "u-current",
      activityId: "a-sushi",
      status: "confirmed",
      willingToBeJuZhang: false,
    };

    expect(getActivityCtaState(sushi, registration)).toEqual({
      label: "已报名",
      disabled: true,
      variant: "completed",
    });
    expect(getActivityCtaState(sushi, { ...registration, status: "waitlisted" })).toEqual({
      label: "排队中",
      disabled: true,
      variant: "queued",
    });
  });
});
