import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import type { ActivityReadAdapter } from "./activityReadService";
import { DEFAULT_CURRENT_USER_ID, listWaitlistEntries, type WaitlistEntry } from "./mockData";
import { resetMockServices, signup } from "./registrationService";
import {
  createMockRegistrationWriteAdapter,
  runCancelSignup,
  runCancelSignupAndRefreshActivity,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlist,
  runSignup,
  runSignupAndRefreshActivity,
  type RegistrationWriteAdapter,
} from "./registrationWriteService";

describe("registration write service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("submits signup through the async write boundary", async () => {
    await expect(
      runSignup(createMockRegistrationWriteAdapter(), "a-coffee", { willingToBeJuZhang: true }),
    ).resolves.toMatchObject({
      status: "ready",
      registration: {
        activityId: "a-coffee",
        userId: DEFAULT_CURRENT_USER_ID,
        status: "confirmed",
        willingToBeJuZhang: true,
      },
    });
  });

  it("refreshes activity detail after signup succeeds", async () => {
    const activityReadAdapter: ActivityReadAdapter = {
      listActivities: vi.fn(async () => []),
      getActivity: vi.fn(async () => ({
        id: "a-coffee",
        title: "周末咖啡聊天局",
        type: "coffee",
        area: "武康路",
        venue: "梧桐边咖啡",
        startsAt: "2026-06-06T15:00:00+08:00",
        capacity: 5,
        currentParticipantCount: 3,
        costPerPerson: 58,
        budgetType: "paid",
        formationStatus: "forming",
        aiRecommendationReason: "人数少，适合第一次尝试陌生人轻社交。",
        organizerAlias: "乔一",
        participantIds: ["u-a", "u-b", DEFAULT_CURRENT_USER_ID],
        imagePath: "images/activity-coffee.jpg",
        gallery: [],
        attractionSummary: "适合轻松聊天。",
        experienceHighlights: [],
        locationGuide: "武康路附近。",
        aaRule: "人均约 58 元。",
      })),
    };

    await expect(
      runSignupAndRefreshActivity(
        createMockRegistrationWriteAdapter(),
        activityReadAdapter,
        "a-coffee",
        { willingToBeJuZhang: true },
      ),
    ).resolves.toMatchObject({
      status: "ready",
      registration: { activityId: "a-coffee", status: "confirmed" },
      activity: { id: "a-coffee", currentParticipantCount: 3 },
    });
    expect(activityReadAdapter.getActivity).toHaveBeenCalledWith("a-coffee");
  });

  it("cancels signup through the async write boundary", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    await expect(runCancelSignup(createMockRegistrationWriteAdapter(), "a-coffee")).resolves.toMatchObject({
      status: "ready",
      registration: {
        activityId: "a-coffee",
        userId: DEFAULT_CURRENT_USER_ID,
        status: "cancelled",
      },
    });
  });

  it("keeps cancellation ready even when the activity refresh fails", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });
    const activityReadAdapter: ActivityReadAdapter = {
      listActivities: vi.fn(async () => []),
      getActivity: vi.fn(async () => {
        throw new Error("云端活动刷新失败");
      }),
    };

    await expect(
      runCancelSignupAndRefreshActivity(createMockRegistrationWriteAdapter(), activityReadAdapter, "a-coffee"),
    ).resolves.toMatchObject({
      status: "ready",
      registration: { activityId: "a-coffee", status: "cancelled" },
      refreshMessage: "云端活动刷新失败",
    });
  });

  it("joins waitlists through the async write boundary", async () => {
    const result = await runJoinWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang");

    expect(result).toMatchObject({
      status: "ready",
      waitlistEntry: {
        activityId: "a-sushi",
        type: "juZhang",
        order: 1,
      },
    });
    expect(listWaitlistEntries()).toHaveLength(1);
  });

  it("confirms arrival and payment through the async write boundary", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    await expect(runConfirmArrival(createMockRegistrationWriteAdapter(), "a-coffee", "arrived")).resolves.toMatchObject({
      status: "ready",
      registration: {
        activityId: "a-coffee",
        status: "arrived",
      },
    });

    await expect(runConfirmPayment(createMockRegistrationWriteAdapter(), "a-coffee")).resolves.toMatchObject({
      status: "ready",
      settlement: {
        activityId: "a-coffee",
        paymentStatusByUser: {
          [DEFAULT_CURRENT_USER_ID]: true,
        },
      },
    });
  });

  it("returns an explicit error when mock payment cannot support a non-default mode", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });

    await expect(runConfirmPayment(createMockRegistrationWriteAdapter(), "a-coffee", "juZhangCollects")).resolves.toEqual({
      status: "error",
      message: "Mock settlement only supports selfPayToMerchant mode",
    });
  });

  it("returns an error state when a write adapter fails", async () => {
    const adapter: RegistrationWriteAdapter = {
      signupActivity: vi.fn(async () => {
        throw new Error("报名暂时失败");
      }),
      joinWaitlist: vi.fn(async () => {
        const entry: WaitlistEntry = {
          id: "w-empty",
          activityId: "a-sushi",
          userId: DEFAULT_CURRENT_USER_ID,
          type: "activity",
          order: 1,
          status: "waiting",
        };

        return entry;
      }),
      confirmArrival: vi.fn(async () => ({}) as Promise<Registration>),
      confirmPayment: vi.fn(async () => ({}) as Promise<Settlement>),
      cancelSignup: vi.fn(async () => ({}) as Promise<Registration>),
    };

    await expect(runSignup(adapter, "a-sushi", { willingToBeJuZhang: false })).resolves.toEqual({
      status: "error",
      message: "报名暂时失败",
    });
  });
});
