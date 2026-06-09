import { describe, expect, it } from "vitest";

import { getActivity } from "./activityService";
import {
  formatActivityDateTime,
  getActivityCtaLabel,
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
});
