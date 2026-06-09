import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_CURRENT_USER_ID, getSettlementByActivityId } from "./mockData";
import { resetMockServices } from "./registrationService";
import {
  acceptJuZhang,
  confirmParticipantArrival,
  confirmParticipantPayment,
  createCloudJuZhangAdapter,
  createMockJuZhangAdapter,
  declineJuZhang,
  getJuZhangWorkspace,
  runAcceptJuZhang,
  runConfirmParticipantArrival,
  runConfirmParticipantPayment,
  runDeclineJuZhang,
  runLoadJuZhangWorkspace,
} from "./juZhangService";
import type { CloudCallAdapter } from "./cloudFunctionClient";

describe("ju zhang service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("loads the workspace with topic card and coordination tasks", () => {
    const workspace = getJuZhangWorkspace("a-sushi");

    expect(workspace.activity?.title).toBe("周五下班日料小局");
    expect(workspace.topicCard?.visibleText).toContain("上海");
    expect(workspace.tasks.map((task) => task.title)).toEqual(["开场 & 破冰", "活动中协调", "AA 结算确认"]);
  });

  it("lets the current user accept or decline ju zhang without leaving the activity", () => {
    expect(acceptJuZhang("a-coffee")).toMatchObject({
      activityId: "a-coffee",
      candidateUserId: DEFAULT_CURRENT_USER_ID,
      status: "accepted",
      volunteered: true,
    });
    expect(declineJuZhang("a-coffee")).toMatchObject({
      activityId: "a-coffee",
      candidateUserId: DEFAULT_CURRENT_USER_ID,
      status: "declined",
    });
  });

  it("updates participant arrival and payment confirmation", () => {
    const arrived = confirmParticipantArrival("a-sushi", "u-chen", "arrived");
    const settlement = confirmParticipantPayment("a-sushi", "u-momo");

    expect(arrived.status).toBe("arrived");
    expect(settlement.paymentStatusByUser["u-momo"]).toBe(true);
    expect(getSettlementByActivityId("a-sushi")?.paymentStatusByUser["u-momo"]).toBe(true);
  });

  it("loads and updates the mock workspace through the async ju zhang adapter", async () => {
    const adapter = createMockJuZhangAdapter();

    await expect(runLoadJuZhangWorkspace(adapter, "a-sushi")).resolves.toMatchObject({
      status: "ready",
      workspace: { activity: { id: "a-sushi" } },
    });
    await expect(runAcceptJuZhang(adapter, "a-coffee")).resolves.toMatchObject({
      status: "ready",
      assignment: { activityId: "a-coffee", status: "accepted" },
    });
    await expect(runDeclineJuZhang(adapter, "a-coffee")).resolves.toMatchObject({
      status: "ready",
      assignment: { activityId: "a-coffee", status: "declined" },
    });
    await expect(runConfirmParticipantArrival(adapter, "a-sushi", "u-chen")).resolves.toMatchObject({
      status: "ready",
      registration: { activityId: "a-sushi", userId: "u-chen", status: "arrived" },
    });
    await expect(runConfirmParticipantPayment(adapter, "a-sushi", "u-momo")).resolves.toMatchObject({
      status: "ready",
      settlement: { activityId: "a-sushi", paymentStatusByUser: { "u-momo": true } },
    });
  });

  it("maps cloud ju zhang adapter operations to cloud functions", async () => {
    const calls: unknown[] = [];
    const cloudAdapter: CloudCallAdapter = {
      callFunction: vi.fn(async (input) => {
        calls.push(input);

        return {
          result: {
            ok: true,
            code: "OK",
            message: "ok",
            data:
              input.name === "getJuZhangWorkspace"
                ? { tasks: [] }
                : input.name === "confirmSettlement"
                  ? { activityId: "a-sushi", type: "paid", totalAmount: 1008, participantCount: 6, paymentStatusByUser: {} }
                  : { activityId: "a-sushi", status: "accepted" },
          },
        };
      }),
    };
    const adapter = createCloudJuZhangAdapter(cloudAdapter);

    await runLoadJuZhangWorkspace(adapter, "a-sushi");
    await runAcceptJuZhang(adapter, "a-sushi");
    await runDeclineJuZhang(adapter, "a-sushi");
    await runConfirmParticipantArrival(adapter, "a-sushi", "u-chen");
    await runConfirmParticipantPayment(adapter, "a-sushi", "u-momo");

    expect(calls).toEqual([
      { name: "getJuZhangWorkspace", data: { activityId: "a-sushi" } },
      { name: "respondJuZhangAssignment", data: { activityId: "a-sushi", response: "accepted" } },
      { name: "respondJuZhangAssignment", data: { activityId: "a-sushi", response: "declined" } },
      { name: "confirmArrival", data: { activityId: "a-sushi", status: "arrived", userId: "u-chen" } },
      {
        name: "confirmSettlement",
        data: {
          activityId: "a-sushi",
          mode: "juZhangCollects",
          participantPaymentStates: { "u-momo": true },
        },
      },
    ]);
  });
});
