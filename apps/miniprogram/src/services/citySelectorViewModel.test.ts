import { describe, expect, it } from "vitest";

import { cityOptions, getCityFromPickerIndex, getCityPickerIndex } from "./citySelectorViewModel";

describe("city selector view model", () => {
  it("provides stable city picker options", () => {
    expect(cityOptions).toEqual(["上海", "北京", "杭州", "成都"]);
  });

  it("maps picker indexes to city names", () => {
    expect(getCityFromPickerIndex("2")).toBe("杭州");
    expect(getCityFromPickerIndex(1)).toBe("北京");
    expect(getCityFromPickerIndex("missing")).toBe("上海");
  });

  it("maps selected city names back to picker indexes", () => {
    expect(getCityPickerIndex("成都")).toBe(3);
    expect(getCityPickerIndex("深圳")).toBe(0);
  });
});
