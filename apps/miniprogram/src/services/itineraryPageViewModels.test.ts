import { describe, expect, it } from "vitest";

import { getItineraryDetailTitle, getItineraryListState } from "./itineraryPageViewModels";

describe("itinerary page view models", () => {
  it("shows a loading state before the itinerary feed has returned", () => {
    expect(getItineraryListState(true, [])).toEqual({
      mode: "loading",
      title: "正在加载行程",
      copy: "正在同步你已报名的小局。",
    });
  });

  it("does not label a detail page as missing while activity detail is still loading", () => {
    expect(getItineraryDetailTitle(undefined, true)).toBe("行程加载中");
    expect(getItineraryDetailTitle(undefined, false)).toBe("活动不存在");
    expect(getItineraryDetailTitle({ title: "周五下班日料小局" }, false)).toBe("周五下班日料小局");
  });
});
