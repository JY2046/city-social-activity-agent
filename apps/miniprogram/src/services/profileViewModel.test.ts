import { describe, expect, it } from "vitest";

import type { User } from "@city-social/domain";

import { getProfileViewModel } from "./profileViewModel";

describe("profile view model", () => {
  const user: User = {
    id: "u-current",
    nickname: "Lily",
    avatar: "L",
    interests: ["饭局", "咖啡"],
    bio: "正在体验小程序冷启动版本。",
    reputationLevel: "可信参与者",
    attendedEventCount: 5,
    showAttendedEventCount: true,
    badges: ["准时到场"],
    canBeJuZhang: true,
  };

  it("shows activity count only when the user chooses to display it", () => {
    expect(getProfileViewModel(user)).toMatchObject({
      nickname: "Lily",
      attendedSummary: "参加过 5 场小局",
      attendedVisibilityLabel: "对外展示中",
      juZhangEligibilityLabel: "可报名局长",
    });

    expect(getProfileViewModel({ ...user, showAttendedEventCount: false })).toMatchObject({
      attendedSummary: "活动经历已隐藏",
      attendedVisibilityLabel: "仅自己可见",
    });
  });
});
