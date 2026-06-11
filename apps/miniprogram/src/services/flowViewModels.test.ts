import { describe, expect, it } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import {
  getArrivalOptions,
  getActivityDetailPrimaryActionState,
  getJuZhangAssignmentLabel,
  getJuZhangBannerState,
  getJuZhangSettlementRows,
  getRegistrationStatusLabel,
  getPaymentActionLabel,
  getSignupPrimaryActionState,
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

  it("shows cancelled signup state without ju zhang task entry", () => {
    expect(getSignupViewState({ ...registration, status: "cancelled" })).toMatchObject({
      title: "已取消报名",
      showJuZhangTaskEntry: false,
    });
  });

  it("treats waitlisted signup as a completed primary signup action", () => {
    expect(getSignupPrimaryActionState({ ...registration, status: "waitlisted" })).toEqual({
      label: "已报名",
      isCompleted: true,
    });
  });

  it("keeps confirmed signup as a completed primary signup action", () => {
    expect(getSignupPrimaryActionState(registration)).toEqual({
      label: "已报名",
      isCompleted: true,
    });
  });

  it("labels activity detail CTA from the current user's registration state", () => {
    expect(getActivityDetailPrimaryActionState()).toEqual({ label: "确认报名", isCompleted: false });
    expect(getActivityDetailPrimaryActionState(registration)).toEqual({
      label: "已报名",
      isCompleted: true,
      variant: "completed",
    });
    expect(getActivityDetailPrimaryActionState({ ...registration, status: "arrived" })).toEqual({
      label: "已报名",
      isCompleted: true,
      variant: "completed",
    });
    expect(getActivityDetailPrimaryActionState({ ...registration, status: "waitlisted" })).toEqual({
      label: "排队中",
      isCompleted: false,
      variant: "queued",
    });
  });

  it("uses short one-line arrival option labels", () => {
    expect(getArrivalOptions().map((option) => option.label)).toEqual(["我会准时到", "可能迟到", "无法到场"]);
  });

  it("formats workflow enum states as Chinese UI copy", () => {
    expect(getRegistrationStatusLabel("confirmed")).toBe("已确认");
    expect(getRegistrationStatusLabel("arrived")).toBe("已到场");
    expect(getRegistrationStatusLabel("noShow")).toBe("未到场");
    expect(getJuZhangAssignmentLabel("accepted")).toBe("已接受");
  });

  it("shows a ju zhang queue state when another participant has accepted", () => {
    expect(
      getJuZhangBannerState({
        assignment: {
          id: "jz-1",
          activityId: "a-sushi",
          candidateUserId: "u-qiao",
          status: "accepted",
          volunteered: true,
        },
        currentUserId: "u-current",
        isQueued: false,
      }),
    ).toEqual({
      title: "当前状态：已有局长",
      copy: "这个小局已经有局长，你可以加入候选排队；如果当前局长退出，系统会按顺序提醒。",
      primaryLabel: "加入局长排队",
      secondaryLabel: undefined,
      mode: "queue",
    });

    expect(
      getJuZhangBannerState({
        assignment: {
          id: "jz-1",
          activityId: "a-sushi",
          candidateUserId: "u-qiao",
          status: "accepted",
          volunteered: true,
        },
        currentUserId: "u-current",
        isQueued: true,
      }).primaryLabel,
    ).toBe("局长排队中");
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

  it("separates participant payment state from ju zhang confirmation copy", () => {
    const settlement: Settlement = {
      activityId: "a-sushi",
      type: "paid",
      totalAmount: 1008,
      participantCount: 2,
      paymentStatusByUser: {
        "u-current": true,
        "u-momo": false,
      },
    };

    expect(
      getJuZhangSettlementRows(settlement, (userId) => (userId === "u-current" ? "Lily" : "Momo"), ["u-current"]),
    ).toEqual([
      {
        userId: "u-current",
        displayName: "Lily",
        participantPaymentLabel: "用户已支付",
        juZhangActionLabel: "已支付",
        canConfirm: false,
      },
      {
        userId: "u-momo",
        displayName: "Momo",
        participantPaymentLabel: "用户未支付",
        juZhangActionLabel: "等待支付",
        canConfirm: false,
      },
    ]);
  });

  it("does not treat user payment as ju zhang confirmation automatically", () => {
    const settlement: Settlement = {
      activityId: "a-sushi",
      type: "paid",
      totalAmount: 168,
      participantCount: 1,
      paymentStatusByUser: {
        "u-current": true,
      },
    };

    expect(getJuZhangSettlementRows(settlement)).toEqual([
      {
        userId: "u-current",
        displayName: "u-current",
        participantPaymentLabel: "用户已支付",
        juZhangActionLabel: "局长确认",
        canConfirm: true,
      },
    ]);
  });

  it("shows paid copy after ju zhang confirms a participant payment", () => {
    const settlement: Settlement = {
      activityId: "a-sushi",
      type: "paid",
      totalAmount: 168,
      participantCount: 1,
      paymentStatusByUser: {
        "u-current": true,
      },
    };

    expect(getJuZhangSettlementRows(settlement, undefined, ["u-current"])).toEqual([
      {
        userId: "u-current",
        displayName: "u-current",
        participantPaymentLabel: "用户已支付",
        juZhangActionLabel: "已支付",
        canConfirm: false,
      },
    ]);
  });

  it("separates activity and ju zhang waitlist titles", () => {
    expect(getWaitlistTitle("activity")).toBe("活动候补中");
    expect(getWaitlistTitle("juZhang")).toBe("局长候选排队中");
  });
});
