import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetMockServices } from "./registrationService";
import {
  createCloudFeedbackAdapter,
  createMockFeedbackAdapter,
  getFeedbackCompletionState,
  runGetFeedbackCompletionState,
  runSubmitFeedback,
  submitFeedback,
} from "./feedbackService";
import type { CloudCallAdapter } from "./cloudFunctionClient";

describe("feedback service", () => {
  beforeEach(() => {
    resetMockServices();
  });

  it("stores mutual selections and opens contact only when both sides choose", () => {
    submitFeedback("a-sushi", {
      selectedUserIds: ["u-lin"],
      abnormalText: "",
    });

    expect(getFeedbackCompletionState("a-sushi", "u-current", "u-lin").isMutual).toBe(false);

    submitFeedback("a-sushi", {
      userId: "u-lin",
      selectedUserIds: ["u-current"],
      abnormalText: "",
    });

    expect(getFeedbackCompletionState("a-sushi", "u-current", "u-lin")).toEqual({
      hasSubmitted: true,
      isMutual: true,
      contactStateLabel: "已互选，可开放联系",
    });
  });

  it("keeps abnormal feedback with the completion state", () => {
    const feedback = submitFeedback("a-sushi", {
      selectedUserIds: [],
      abnormalText: "有人临时爽约",
    });

    expect(feedback.abnormalText).toBe("有人临时爽约");
    expect(getFeedbackCompletionState("a-sushi", "u-current", "u-chen").contactStateLabel).toBe("已提交反馈");
  });

  it("submits feedback and reads completion state through the async mock adapter", async () => {
    const adapter = createMockFeedbackAdapter();

    await expect(runSubmitFeedback(adapter, "a-sushi", { selectedUserIds: ["u-lin"], abnormalText: "" })).resolves
      .toMatchObject({
        status: "ready",
        feedback: { activityId: "a-sushi", userId: "u-current", selectedUserIds: ["u-lin"] },
      });
    await expect(runGetFeedbackCompletionState(adapter, "a-sushi", "u-lin")).resolves.toMatchObject({
      status: "ready",
      completionState: { hasSubmitted: true, isMutual: false, contactStateLabel: "已提交反馈" },
    });
  });

  it("maps cloud feedback adapter operations to cloud functions", async () => {
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
              input.name === "submitFeedback"
                ? { id: "fb-a-sushi-u-current", activityId: "a-sushi", userId: "u-current" }
                : { hasSubmitted: true, isMutual: false, contactStateLabel: "已提交反馈" },
          },
        };
      }),
    };
    const adapter = createCloudFeedbackAdapter(cloudAdapter);

    await runSubmitFeedback(adapter, "a-sushi", { selectedUserIds: ["u-lin"], abnormalText: "" });
    await runGetFeedbackCompletionState(adapter, "a-sushi", "u-lin");

    expect(calls).toEqual([
      { name: "submitFeedback", data: { activityId: "a-sushi", selectedUserIds: ["u-lin"], abnormalText: "" } },
      { name: "getFeedbackCompletionState", data: { activityId: "a-sushi", candidateUserId: "u-lin" } },
    ]);
  });
});
