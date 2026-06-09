import { describe, expect, it } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import {
  getArrivalOptions,
  getPaymentActionLabel,
  getSignupViewState,
  getWaitlistTitle,
  shouldShowJuZhangTasks,
} from "./flowViewModels";

describe("mini program flow view models", () => {
  const registration: Registration = {
    id: "r-current",
    userId: "u-current",
    activityId: "a-coffee",
    status: "confirmed",
    willingToBeJuZhang: false,
  };

  it("keeps ju zhang tasks hidden when a normal participant signs up", () => {
    expect(shouldShowJuZhangTasks(registration)).toBe(false);
    expect(getSignupViewState(registration)).toMatchObject({
      title: "报名成功",
      showJuZhangTaskEntry: false,
    });
  });

  it("shows ju zhang task entry only after the user opts in", () => {
    const willingRegistration: Registration = {
      ...registration,
      willingToBeJuZhang: true,
    };

    expect(shouldShowJuZhangTasks(willingRegistration)).toBe(true);
    expect(getSignupViewState(willingRegistration).showJuZhangTaskEntry).toBe(true);
  });

  it("uses short one-line arrival option labels", () => {
    expect(getArrivalOptions().map((option) => option.label)).toEqual(["我会准时到", "可能迟到", "无法到场"]);
  });

  it("shows payment work only for unpaid paid activities", () => {
    const unpaidPaidSettlement: Settlement = {
      activityId: "a-coffee",
      type: "paid",
      totalAmount: 116,
      participantCount: 2,
      paymentStatusByUser: {
        "u-current": false,
      },
    };
    const paidSettlement: Settlement = {
      ...unpaidPaidSettlement,
      paymentStatusByUser: {
        "u-current": true,
      },
    };
    const freeSettlement: Settlement = {
      activityId: "a-walk",
      type: "free",
      totalAmount: 0,
      participantCount: 3,
      paymentStatusByUser: {},
    };

    expect(getPaymentActionLabel(unpaidPaidSettlement, "u-current")).toBe("确认已支付");
    expect(getPaymentActionLabel(paidSettlement, "u-current")).toBe("已完成支付");
    expect(getPaymentActionLabel(freeSettlement, "u-current")).toBe("本活动免费");
  });

  it("separates activity and ju zhang waitlist titles", () => {
    expect(getWaitlistTitle("activity")).toBe("活动候补中");
    expect(getWaitlistTitle("juZhang")).toBe("局长候选排队中");
  });
});
