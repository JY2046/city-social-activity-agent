import { describe, expect, it } from "vitest";
import { activities, settlements, topicCards, users } from "./mockData";

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
          activity.participantIds.every((participantId) => paymentUserIds.includes(participantId)) &&
          Object.values(settlement.paymentStatusByUser).filter((hasPaid) => !hasPaid).length === 1
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
