import { beforeEach, describe, expect, it } from "vitest";

import { resetMockServices } from "./registrationService";
import { getFeedbackCompletionState, submitFeedback } from "./feedbackService";

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
});
