import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CURRENT_USER_ID, getSettlementByActivityId } from "./mockData";
import { resetMockServices } from "./registrationService";
import {
  acceptJuZhang,
  confirmParticipantArrival,
  confirmParticipantPayment,
  declineJuZhang,
  getJuZhangWorkspace,
} from "./juZhangService";

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
});
