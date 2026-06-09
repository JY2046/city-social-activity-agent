import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import { DEFAULT_CURRENT_USER_ID, listWaitlistEntries, type WaitlistEntry } from "./mockData";
import { resetMockServices, signup } from "./registrationService";
import {
  createMockRegistrationWriteAdapter,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlist,
  runSignup,
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
    };

    await expect(runSignup(adapter, "a-sushi", { willingToBeJuZhang: false })).resolves.toEqual({
      status: "error",
      message: "报名暂时失败",
    });
  });
});
