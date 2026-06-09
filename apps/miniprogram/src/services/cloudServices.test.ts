import { describe, expect, it, vi } from "vitest";

import type { Registration, Settlement } from "@city-social/domain";

import type { CloudCallAdapter, CloudFunctionName } from "./cloudFunctionClient";
import {
  cloudAcceptJuZhang,
  cloudConfirmArrival,
  cloudConfirmSettlement,
  cloudGetFeedbackCompletionState,
  cloudGetJuZhangWorkspace,
  cloudJoinWaitlist,
  cloudListActivities,
  cloudSignupActivity,
  cloudSubmitFeedback,
} from "./cloudServices";

function createCapturingAdapter(dataByFunction: Partial<Record<CloudFunctionName, unknown>>) {
  const calls: Array<{ name: CloudFunctionName; data?: unknown }> = [];
  const adapter: CloudCallAdapter = {
    callFunction: vi.fn(async (input) => {
      calls.push(input);

      return {
        result: {
          ok: true,
          code: "OK",
          message: "ok",
          data: dataByFunction[input.name],
        },
      };
    }),
  };

  return { adapter, calls };
}

describe("cloud service wrappers", () => {
  it("maps activity feed and signup to typed cloud functions", async () => {
    const registration: Registration = {
      id: "r-a-sushi-u-current",
      activityId: "a-sushi",
      userId: "u-current",
      status: "confirmed",
      willingToBeJuZhang: true,
    };
    const { adapter, calls } = createCapturingAdapter({
      listActivities: [],
      signupActivity: registration,
    });

    await expect(cloudListActivities(adapter, { city: "上海", type: "dinner" })).resolves.toEqual([]);
    await expect(
      cloudSignupActivity(adapter, "a-sushi", {
        willingToBeJuZhang: true,
      }),
    ).resolves.toEqual(registration);

    expect(calls).toEqual([
      { name: "listActivities", data: { city: "上海", type: "dinner" } },
      { name: "signupActivity", data: { activityId: "a-sushi", willingToBeJuZhang: true } },
    ]);
  });

  it("maps itinerary operations to cloud functions", async () => {
    const settlement: Settlement = {
      activityId: "a-sushi",
      type: "paid",
      totalAmount: 1008,
      participantCount: 6,
      paymentStatusByUser: { "u-current": true },
    };
    const { adapter, calls } = createCapturingAdapter({
      joinWaitlist: { id: "w-a-sushi", activityId: "a-sushi", userId: "u-current", type: "juZhang", order: 1, status: "waiting" },
      confirmArrival: { id: "r-a-sushi", activityId: "a-sushi", userId: "u-current", status: "arrived", willingToBeJuZhang: false },
      confirmSettlement: settlement,
    });

    await cloudJoinWaitlist(adapter, "a-sushi", "juZhang");
    await cloudConfirmArrival(adapter, "a-sushi", "arrived");
    await expect(cloudConfirmSettlement(adapter, { activityId: "a-sushi", mode: "selfPayToMerchant" })).resolves.toEqual(
      settlement,
    );

    expect(calls).toEqual([
      { name: "joinWaitlist", data: { activityId: "a-sushi", type: "juZhang" } },
      { name: "confirmArrival", data: { activityId: "a-sushi", status: "arrived" } },
      { name: "confirmSettlement", data: { activityId: "a-sushi", mode: "selfPayToMerchant" } },
    ]);
  });

  it("maps ju zhang and feedback workflows to cloud functions", async () => {
    const { adapter, calls } = createCapturingAdapter({
      getJuZhangWorkspace: { tasks: [] },
      respondJuZhangAssignment: { status: "accepted" },
      submitFeedback: { id: "fb-a-sushi-u-current" },
      getFeedbackCompletionState: { hasSubmitted: true, isMutual: false, contactStateLabel: "已提交反馈" },
    });

    await cloudGetJuZhangWorkspace(adapter, "a-sushi");
    await cloudAcceptJuZhang(adapter, "a-sushi");
    await cloudSubmitFeedback(adapter, "a-sushi", { selectedUserIds: ["u-lin"], abnormalText: "" });
    await expect(cloudGetFeedbackCompletionState(adapter, "a-sushi", "u-lin")).resolves.toMatchObject({
      contactStateLabel: "已提交反馈",
    });

    expect(calls).toEqual([
      { name: "getJuZhangWorkspace", data: { activityId: "a-sushi" } },
      { name: "respondJuZhangAssignment", data: { activityId: "a-sushi", response: "accepted" } },
      { name: "submitFeedback", data: { activityId: "a-sushi", selectedUserIds: ["u-lin"], abnormalText: "" } },
      { name: "getFeedbackCompletionState", data: { activityId: "a-sushi", candidateUserId: "u-lin" } },
    ]);
  });
});
