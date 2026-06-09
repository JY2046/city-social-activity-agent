import { describe, expect, it } from "vitest";
import {
  canCancelWithoutPenalty,
  getParticipantPreview,
  getSettlementSummary,
  getVisibleJuZhangCandidates,
  isMutualContact,
  mockActivities,
  mockRegistrations,
  mockSettlements,
  mockTopicCards,
  mockUsers,
} from "./index";
import type { Registration, User } from "./index";

describe("domain package", () => {
  it("exports curated activities with matching topic cards", () => {
    const topicActivityIds = new Set(mockTopicCards.map((topicCard) => topicCard.activityId));

    expect(mockActivities).toHaveLength(4);
    expect(mockActivities.every((activity) => topicActivityIds.has(activity.id))).toBe(true);
  });

  it("keeps paid and free settlement behavior explicit", () => {
    const paid = getSettlementSummary(mockSettlements.find((settlement) => settlement.activityId === "a-sushi")!);
    const free = getSettlementSummary(mockSettlements.find((settlement) => settlement.activityId === "a-walk")!);

    expect(paid).toEqual({ label: "人均 168 元", unpaidCount: 1, isFree: false });
    expect(free).toEqual({ label: "本活动无费用", unpaidCount: 0, isFree: true });
  });

  it("uses participant and ju zhang cancellation windows", () => {
    const startsAt = new Date("2026-06-05T19:30:00+08:00");

    expect(canCancelWithoutPenalty(startsAt, new Date("2026-06-05T06:00:00+08:00"), "participant")).toBe(true);
    expect(canCancelWithoutPenalty(startsAt, new Date("2026-06-05T12:00:00+08:00"), "participant")).toBe(false);
    expect(canCancelWithoutPenalty(startsAt, new Date("2026-06-04T20:00:00+08:00"), "juZhang")).toBe(false);
  });

  it("sorts active ju zhang volunteers ahead of passive candidates", () => {
    const candidates = getVisibleJuZhangCandidates(mockUsers, mockRegistrations, "a-sushi");

    expect(candidates[0].id).toBe("u-qiao");
    expect(candidates.every((user) => user.canBeJuZhang)).toBe(true);
  });

  it("excludes inactive registrations from ju zhang candidate selection", () => {
    const users: User[] = [
      { ...mockUsers[0], id: "u-confirmed", attendedEventCount: 5 },
      { ...mockUsers[0], id: "u-arrived", attendedEventCount: 4 },
      { ...mockUsers[0], id: "u-waitlisted", attendedEventCount: 30 },
      { ...mockUsers[0], id: "u-cancelled", attendedEventCount: 40 },
    ];
    const registrations: Registration[] = [
      {
        id: "r-confirmed",
        userId: "u-confirmed",
        activityId: "a-review",
        status: "confirmed",
        willingToBeJuZhang: true,
      },
      { id: "r-arrived", userId: "u-arrived", activityId: "a-review", status: "arrived", willingToBeJuZhang: true },
      {
        id: "r-waitlisted",
        userId: "u-waitlisted",
        activityId: "a-review",
        status: "waitlisted",
        willingToBeJuZhang: true,
      },
      {
        id: "r-cancelled",
        userId: "u-cancelled",
        activityId: "a-review",
        status: "cancelled",
        willingToBeJuZhang: true,
      },
    ];

    expect(getVisibleJuZhangCandidates(users, registrations, "a-review").map((user) => user.id).sort()).toEqual([
      "u-arrived",
      "u-confirmed",
    ]);
  });

  it("formats participant previews and mutual contact privacy", () => {
    expect(getParticipantPreview(mockUsers[0]).attendedEventLabel).toBe("参加过 7 场活动");
    expect(getParticipantPreview(mockUsers[2]).attendedEventLabel).toBe("活动经历未公开");
    expect(isMutualContact("u-lin", "u-chen", { "u-lin": ["u-chen"], "u-chen": ["u-lin"] })).toBe(true);
    expect(isMutualContact("u-lin", "u-momo", { "u-lin": ["u-momo"], "u-momo": [] })).toBe(false);
  });
});
