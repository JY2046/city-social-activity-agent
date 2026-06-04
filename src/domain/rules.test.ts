import { describe, expect, it } from "vitest";
import { activities, registrations, settlements, topicCards, users } from "./mockData";
import {
  canCancelWithoutPenalty,
  getParticipantPreview,
  getSettlementSummary,
  getVisibleJuZhangCandidates,
  isMutualContact,
} from "./rules";

describe("mock data", () => {
  it("contains paid and free activities for the MVP scenarios", () => {
    expect(activities).toHaveLength(4);
    expect(activities.some((activity) => activity.budgetType === "paid")).toBe(true);
    expect(activities.some((activity) => activity.budgetType === "free")).toBe(true);
  });

  it("lets users choose whether attended event count is visible", () => {
    expect(users.some((user) => user.showAttendedEventCount)).toBe(true);
    expect(users.some((user) => !user.showAttendedEventCount)).toBe(true);
  });

  it("has a matching topic card for every activity", () => {
    const topicActivityIds = new Set(topicCards.map((topicCard) => topicCard.activityId));

    expect(activities.every((activity) => topicActivityIds.has(activity.id))).toBe(true);
  });

  it("has paid settlements for every paid activity that requires settlement", () => {
    const paidSettlementsByActivityId = new Map(
      settlements
        .filter((settlement) => settlement.type === "paid")
        .map((settlement) => [settlement.activityId, settlement]),
    );

    const paidActivitiesRequiringSettlement = activities.filter(
      (activity) => activity.budgetType === "paid" && activity.requiresSettlement,
    );

    expect(
      paidActivitiesRequiringSettlement.every((activity) => {
        const settlement = paidSettlementsByActivityId.get(activity.id);
        const paymentUserIds = Object.keys(settlement?.paymentStatusByUser ?? {});

        return (
          settlement !== undefined &&
          settlement.totalAmount > 0 &&
          paymentUserIds.length === activity.participantIds.length &&
          activity.participantIds.every((participantId) => paymentUserIds.includes(participantId))
        );
      }),
    ).toBe(true);
  });

  it("keeps free activities free of money work", () => {
    const settlementsByActivityId = new Map(settlements.map((settlement) => [settlement.activityId, settlement]));
    const freeActivities = activities.filter((activity) => activity.budgetType === "free");

    expect(
      freeActivities.every((activity) => {
        const settlement = settlementsByActivityId.get(activity.id);

        return (
          settlement?.type === "free" &&
          settlement.totalAmount === 0 &&
          Object.keys(settlement.paymentStatusByUser).length === 0
        );
      }),
    ).toBe(true);
  });

  it("references existing users from every activity participant list", () => {
    const userIds = new Set(users.map((user) => user.id));
    const participantIds = activities.flatMap((activity) => activity.participantIds);

    expect(participantIds.every((participantId) => userIds.has(participantId))).toBe(true);
  });

  it("has an active registration for every activity participant", () => {
    const activeRegistrationKeys = new Set(
      registrations
        .filter((registration) => registration.status === "confirmed" || registration.status === "arrived")
        .map((registration) => `${registration.activityId}:${registration.userId}`),
    );

    expect(
      activities.every((activity) =>
        activity.participantIds.every((participantId) => activeRegistrationKeys.has(`${activity.id}:${participantId}`)),
      ),
    ).toBe(true);
  });

  it("aligns participant counts across activities and settlements", () => {
    const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));

    expect(
      activities.every((activity) => activity.currentParticipantCount === activity.participantIds.length),
    ).toBe(true);
    expect(
      settlements.every((settlement) => {
        const activity = activitiesById.get(settlement.activityId);

        return activity !== undefined && settlement.participantCount === activity.currentParticipantCount;
      }),
    ).toBe(true);
  });

  it("uses the MVP privacy boundary on every activity", () => {
    expect(
      activities.every(
        (activity) =>
          activity.privacyRule.includes("活动前不开放私信和联系方式") &&
          activity.privacyRule.includes("活动后双方互选才开放联系"),
      ),
    ).toBe(true);
  });
});

describe("activity rules", () => {
  it("shows attended event count only when the user opts in", () => {
    const visible = getParticipantPreview(users[0]);
    const hidden = getParticipantPreview(users[2]);

    expect(visible.attendedEventLabel).toBe("参加过 7 场活动");
    expect(hidden.attendedEventLabel).toBe("活动经历未公开");
  });

  it("uses 12 hours for participant cancellation and 24 hours for ju zhang cancellation", () => {
    const start = new Date("2026-06-05T19:30:00+08:00");
    const participantTime = new Date("2026-06-05T06:00:00+08:00");
    const lateParticipantTime = new Date("2026-06-05T12:00:00+08:00");
    const juZhangTime = new Date("2026-06-04T20:00:00+08:00");

    expect(canCancelWithoutPenalty(start, participantTime, "participant")).toBe(true);
    expect(canCancelWithoutPenalty(start, lateParticipantTime, "participant")).toBe(false);
    expect(canCancelWithoutPenalty(start, juZhangTime, "juZhang")).toBe(false);
  });

  it("prioritizes eligible volunteers for ju zhang", () => {
    const candidates = getVisibleJuZhangCandidates(users, registrations, "a-sushi");

    expect(candidates[0].id).toBe("u-qiao");
    expect(candidates.every((user) => user.canBeJuZhang)).toBe(true);
  });

  it("calculates paid settlement and hides money work for free activities", () => {
    const paid = getSettlementSummary(settlements[0]);
    const free = getSettlementSummary(settlements.find((settlement) => settlement.activityId === "a-walk")!);

    expect(paid.label).toBe("人均 168 元");
    expect(paid.unpaidCount).toBe(1);
    expect(free.label).toBe("本活动无费用");
    expect(free.unpaidCount).toBe(0);
  });

  it("opens contact only when both users choose each other", () => {
    expect(isMutualContact("u-lin", "u-chen", { "u-lin": ["u-chen"], "u-chen": ["u-lin"] })).toBe(true);
    expect(isMutualContact("u-lin", "u-momo", { "u-lin": ["u-momo"], "u-momo": [] })).toBe(false);
  });
});
