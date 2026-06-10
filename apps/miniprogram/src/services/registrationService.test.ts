import { beforeEach, describe, expect, it } from "vitest";

import {
  cancelSignup,
  confirmArrival,
  confirmPayment,
  joinWaitlist,
  resetMockServices,
  signup,
} from "./registrationService";
import { getActivity, listActivities } from "./activityService";
import { DEFAULT_CURRENT_USER_ID, getSettlementByActivityId, getUserDisplayName, listWaitlistEntries } from "./mockData";

describe("mini program registration service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("lists activities with mini program image paths", () => {
    const activities = listActivities();

    expect(activities).toHaveLength(4);
    expect(activities[0].coverImagePath).toBe("/assets/images/activity-sushi.jpg");
    expect(activities[0].gallery.every((item) => item.imagePath.startsWith("/assets/"))).toBe(true);
  });

  it("returns an activity by id", () => {
    expect(getActivity("a-sushi")?.title).toBe("周五下班日料小局");
    expect(getActivity("missing")).toBeUndefined();
  });

  it("resolves user display names without exposing internal ids", () => {
    expect(getUserDisplayName("u-lin")).toBe("林夏");
    expect(getUserDisplayName("missing-user")).toBe("匿名参与者");
  });

  it("signs up the current user and keeps ju zhang willingness explicit", () => {
    const registration = signup("a-coffee", { willingToBeJuZhang: true });

    expect(registration).toMatchObject({
      activityId: "a-coffee",
      userId: DEFAULT_CURRENT_USER_ID,
      status: "confirmed",
      willingToBeJuZhang: true,
    });
    expect(getActivity("a-coffee")?.currentParticipantCount).toBe(3);
  });

  it("cancels the current user's signup and rolls back activity and settlement state", () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    const cancelled = cancelSignup("a-coffee");

    expect(cancelled).toMatchObject({
      activityId: "a-coffee",
      userId: DEFAULT_CURRENT_USER_ID,
      status: "cancelled",
    });
    expect(getActivity("a-coffee")?.currentParticipantCount).toBe(2);
    expect(getActivity("a-coffee")?.participantIds).not.toContain(DEFAULT_CURRENT_USER_ID);
    expect(getSettlementByActivityId("a-coffee")?.participantCount).toBe(2);
    expect(getSettlementByActivityId("a-coffee")?.paymentStatusByUser).not.toHaveProperty(DEFAULT_CURRENT_USER_ID);
  });

  it("puts full activities into the activity waitlist instead of overbooking", () => {
    const registration = signup("a-bar", { willingToBeJuZhang: false });

    expect(registration.status).toBe("waitlisted");
    expect(getActivity("a-bar")?.currentParticipantCount).toBe(2);
    expect(listWaitlistEntries()).toContainEqual(
      expect.objectContaining({ activityId: "a-bar", type: "activity", userId: DEFAULT_CURRENT_USER_ID }),
    );
  });

  it("can join activity and ju zhang waitlists directly", () => {
    const activityWaitlist = joinWaitlist("a-bar", "activity");
    const juZhangWaitlist = joinWaitlist("a-sushi", "juZhang");

    expect(activityWaitlist.order).toBe(1);
    expect(juZhangWaitlist.type).toBe("juZhang");
    expect(listWaitlistEntries()).toHaveLength(2);
  });

  it("updates arrival status for the current user's active registration", () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    const arrived = confirmArrival("a-coffee", "arrived");

    expect(arrived.status).toBe("arrived");
  });

  it("confirms current user payment for paid activities", () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    const settlement = confirmPayment("a-coffee");

    expect(settlement.paymentStatusByUser[DEFAULT_CURRENT_USER_ID]).toBe(true);
  });

  it("keeps free activities free of payment work", () => {
    signup("a-walk", { willingToBeJuZhang: false });

    const settlement = confirmPayment("a-walk");

    expect(settlement.type).toBe("free");
    expect(getSettlementByActivityId("a-walk")?.paymentStatusByUser).toEqual({});
  });
});
