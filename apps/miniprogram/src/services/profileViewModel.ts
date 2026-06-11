import type { User } from "@city-social/domain";

import { clone } from "./clone";
import { DEFAULT_CURRENT_USER_ID, getMockStore } from "./mockData";

export interface ProfileViewModel {
  nickname: string;
  avatar: string;
  bio: string;
  reputationLevel: string;
  creditScoreLabel: string;
  publicReputationCopy: string;
  attendedSummary: string;
  attendedVisibilityLabel: string;
  juZhangEligibilityLabel: string;
  badges: string[];
  interests: string[];
}

export const availableInterestOptions = ["饭局", "咖啡", "酒吧", "免费散步"];

export function getCurrentUserProfile(): User {
  const user = getMockStore().users.find((item) => item.id === DEFAULT_CURRENT_USER_ID);

  if (!user) {
    throw new Error("当前用户不存在");
  }

  return clone(user);
}

export function getProfileViewModel(user: User = getCurrentUserProfile()): ProfileViewModel {
  return {
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    reputationLevel: user.reputationLevel,
    creditScoreLabel: "信用分 86",
    publicReputationCopy: "对外只展示等级，不展示信用分",
    attendedSummary: user.showAttendedEventCount ? `参加过 ${user.attendedEventCount} 场小局` : "活动经历已隐藏",
    attendedVisibilityLabel: user.showAttendedEventCount ? "对外展示中" : "仅自己可见",
    juZhangEligibilityLabel: user.canBeJuZhang ? "可报名局长" : "暂不可报名局长",
    badges: user.badges.filter((badge) => badge !== "准时到场"),
    interests: user.interests,
  };
}

export function toggleInterestSelection(selectedInterests: string[], interest: string): string[] {
  return selectedInterests.includes(interest)
    ? selectedInterests.filter((item) => item !== interest)
    : [...selectedInterests, interest];
}
