import { beforeEach, describe, expect, it } from "vitest";

import { createCloudHandlers } from "./cloudHandlers";
import { createInMemoryCloudStore } from "./cloudStore";

describe("cloud function handlers", () => {
  let handlers: ReturnType<typeof createCloudHandlers>;

  beforeEach(() => {
    handlers = createCloudHandlers(createInMemoryCloudStore());
  });

  it("lists and loads activity details through cloud envelopes", async () => {
    await expect(handlers.listActivities({ city: "上海" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      code: "OK",
      data: expect.arrayContaining([expect.objectContaining({ id: "a-sushi" })]),
    });

    await expect(handlers.getActivityDetail({ activityId: "a-sushi" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      code: "OK",
      data: { activity: expect.objectContaining({ id: "a-sushi", title: "周五下班日料小局" }) },
    });
  });

  it("signs up or waitlists the current user", async () => {
    await expect(
      handlers.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-coffee", status: "confirmed", willingToBeJuZhang: true },
    });

    await expect(
      handlers.signupActivity({ activityId: "a-bar", willingToBeJuZhang: false }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-bar", status: "waitlisted" },
    });
  });

  it("cancels the current user's active registration", async () => {
    await handlers.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, { userId: "u-current" });

    await expect(handlers.cancelRegistration({ activityId: "a-coffee" }, { userId: "u-current" })).resolves
      .toMatchObject({
        ok: true,
        data: { activityId: "a-coffee", userId: "u-current", status: "cancelled" },
      });

    await expect(handlers.confirmArrival({ activityId: "a-coffee", status: "arrived" }, { userId: "u-current" }))
      .resolves.toMatchObject({
        ok: false,
        code: "REGISTRATION_NOT_FOUND",
      });
  });

  it("joins waitlists idempotently", async () => {
    const first = await handlers.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, { userId: "u-current" });
    const second = await handlers.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, { userId: "u-current" });

    expect(first).toMatchObject({ ok: true, data: { order: 1 } });
    expect(second).toEqual(first);
  });

  it("confirms arrival and settlement", async () => {
    await handlers.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, { userId: "u-current" });

    await expect(
      handlers.confirmArrival({ activityId: "a-coffee", status: "arrived" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-coffee", status: "arrived" },
    });

    await expect(
      handlers.confirmSettlement({ activityId: "a-coffee", mode: "selfPayToMerchant" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-coffee", paymentStatusByUser: { "u-current": true } },
    });
  });

  it("returns failure envelopes for missing activities", async () => {
    await expect(handlers.getActivityDetail({ activityId: "missing" }, { userId: "u-current" })).resolves.toEqual({
      ok: false,
      code: "ACTIVITY_NOT_FOUND",
      message: "Activity not found",
      data: null,
    });
  });
});
