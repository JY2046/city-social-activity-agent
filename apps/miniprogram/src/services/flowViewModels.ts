import type { Registration, Settlement } from "@city-social/domain";

import type { ArrivalStatus } from "./registrationService";
import type { WaitlistType } from "./mockData";

export interface ArrivalOption {
  status: ArrivalStatus;
  label: string;
  description: string;
}

export interface SignupViewState {
  title: string;
  message: string;
  showJuZhangTaskEntry: boolean;
}

export interface JuZhangSettlementRow {
  userId: string;
  displayName: string;
  participantPaymentLabel: string;
  juZhangActionLabel: string;
  canConfirm: boolean;
}

const arrivalOptions: ArrivalOption[] = [
  { status: "arrived", label: "我会准时到", description: "活动前 30 分钟同步给局长" },
  { status: "confirmed", label: "可能迟到", description: "局长会看到你的状态" },
  { status: "noShow", label: "无法到场", description: "系统会记录并提示风险" },
];

export function shouldShowJuZhangTasks(registration?: Registration): boolean {
  return registration?.status === "confirmed" && registration.willingToBeJuZhang;
}

export function getSignupViewState(registration?: Registration): SignupViewState {
  if (!registration) {
    return {
      title: "确认报名",
      message: "勾选规则后即可加入活动。",
      showJuZhangTaskEntry: false,
    };
  }

  if (registration.status === "waitlisted") {
    return {
      title: "已加入候补",
      message: "活动满员时会先进入候补队列，有名额会提醒你。",
      showJuZhangTaskEntry: false,
    };
  }

  return {
    title: "报名成功",
    message: registration.willingToBeJuZhang
      ? "已勾选愿意担任局长，系统会在活动前 24 小时内确认。"
      : "你已完成普通报名，不会显示局长任务。",
    showJuZhangTaskEntry: shouldShowJuZhangTasks(registration),
  };
}

export function getArrivalOptions(): ArrivalOption[] {
  return arrivalOptions;
}

export function getPaymentActionLabel(settlement: Settlement | undefined, userId: string): string {
  if (!settlement || settlement.type === "free" || settlement.totalAmount === 0) {
    return "本活动免费";
  }

  return settlement.paymentStatusByUser[userId] ? "已完成支付" : "确认已支付";
}

export function getJuZhangSettlementRows(
  settlement: Settlement | undefined,
  getDisplayName: (userId: string) => string = (userId) => userId,
): JuZhangSettlementRow[] {
  if (!settlement || settlement.type === "free" || settlement.totalAmount === 0) {
    return [];
  }

  return Object.entries(settlement.paymentStatusByUser).map(([userId, hasPaid]) => ({
    userId,
    displayName: getDisplayName(userId),
    participantPaymentLabel: hasPaid ? "用户已支付" : "用户未支付",
    juZhangActionLabel: hasPaid ? "已确认" : "局长确认",
    canConfirm: !hasPaid,
  }));
}

export function getWaitlistTitle(type: WaitlistType): string {
  return type === "juZhang" ? "局长候选排队中" : "活动候补中";
}

export function getWaitlistDescription(type: WaitlistType): string {
  return type === "juZhang"
    ? "该活动已有局长，你已进入候选队列；如果当前局长退出，系统会按顺序提醒。"
    : "活动已满员，你已进入候补队列；有人退出时会优先提醒。";
}
