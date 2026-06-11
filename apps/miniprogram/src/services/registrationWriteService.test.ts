import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import type { ActivityReadAdapter } from "./activityReadService";
import { DEFAULT_CURRENT_USER_ID, listWaitlistEntries, type WaitlistEntry } from "./mockData";
import { resetMockServices, signup } from "./registrationService";
import { createMockUserActivityReadAdapter } from "./userActivityService";
import {
  createMockRegistrationWriteAdapter,
  runCancelSignup,
  runCancelSignupAndRefreshActivity,
  runCancelSignupAndRefreshMyActivityFeed,
  runCancelWaitlist,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlist,
  runJoinWaitlistAndRefreshActivity,
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

  it("refreshes my activity feed after cancellation succeeds", async () => {
    signup("a-coffee", { willingToBeJuZhang: false });
    signup("a-bar", { willingToBeJuZhang: false });

    await expect(
      runCancelSignupAndRefreshMyActivityFeed(
        createMockRegistrationWriteAdapter(),
        createMockUserActivityReadAdapter(),
        "a-coffee",
      ),
    ).resolves.toMatchObject({
      status: "ready",
      registration: { activityId: "a-coffee", status: "cancelled" },
      items: [
        {
          registration: { activityId: "a-bar", status: "waitlisted" },
          activity: { id: "a-bar" },
        },
      ],
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

  it("cancels waitlists through the async write boundary", async () => {
    await runJoinWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang");

    await expect(runCancelWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang")).resolves.toMatchObject({
      status: "ready",
      waitlistEntry: {
        activityId: "a-sushi",
        type: "juZhang",
        status: "cancelled",
      },
    });
  });

  it("reactivates a cancelled ju zhang waitlist when the user applies again", async () => {
    await runJoinWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang");
    await runCancelWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang");

    await expect(runJoinWaitlist(createMockRegistrationWriteAdapter(), "a-sushi", "juZhang")).resolves.toMatchObject({
      status: "ready",
      waitlistEntry: {
        activityId: "a-sushi",
        type: "juZhang",
        status: "waiting",
      },
    });
  });

  it("refreshes activity detail after joining a waitlist succeeds", async () => {
    const activityReadAdapter: ActivityReadAdapter = {
      listActivities: vi.fn(async () => []),
      getActivity: vi.fn(async () => ({
        id: "a-sushi",
        title: "周五下班日料小局",
        type: "dinner",
        area: "静安寺",
        venue: "若竹日料",
        startsAt: "2026-06-05T19:30:00+08:00",
        capacity: 6,
        currentParticipantCount: 6,
        costPerPerson: 168,
        budgetType: "paid",
        formationStatus: "formed",
        aiRecommendationReason: "适合想下班后轻松吃饭的人。",
        organizerAlias: "乔一",
        participantIds: ["u-a", "u-b", "u-c", "u-d", "u-e", "u-f"],
        imagePath: "images/activity-sushi.jpg",
        gallery: [],
        attractionSummary: "小红书热门日料店。",
        experienceHighlights: [],
        locationGuide: "静安寺附近。",
        aaRule: "人均约 168 元。",
      })),
    };

    await expect(
      runJoinWaitlistAndRefreshActivity(
        createMockRegistrationWriteAdapter(),
        activityReadAdapter,
        "a-sushi",
        "juZhang",
      ),
    ).resolves.toMatchObject({
      status: "ready",
      waitlistEntry: { activityId: "a-sushi", type: "juZhang", order: 1 },
      activity: { id: "a-sushi", currentParticipantCount: 6 },
    });
    expect(activityReadAdapter.getActivity).toHaveBeenCalledWith("a-sushi");
  });

  it("keeps waitlist ready even when the activity refresh fails", async () => {
    const activityReadAdapter: ActivityReadAdapter = {
      listActivities: vi.fn(async () => []),
      getActivity: vi.fn(async () => {
        throw new Error("云端活动刷新失败");
      }),
    };

    await expect(
      runJoinWaitlistAndRefreshActivity(
        createMockRegistrationWriteAdapter(),
        activityReadAdapter,
        "a-sushi",
        "activity",
      ),
    ).resolves.toMatchObject({
      status: "ready",
      waitlistEntry: { activityId: "a-sushi", type: "activity", order: 1 },
      refreshMessage: "云端活动刷新失败",
    });
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
      cancelWaitlist: vi.fn(async () => ({}) as Promise<WaitlistEntry>),
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
