import { Button, Text, Textarea, View } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import {
  createFeedbackAdapter,
  runGetFeedbackCompletionState,
  runSubmitFeedback,
  type FeedbackCompletionState,
} from "../../services/feedbackService";
import { DEFAULT_CURRENT_USER_ID, getUserDisplayName } from "../../services/mockData";

import "../signup/index.css";
import "./index.css";

export default function FeedbackPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const activity = getActivity(activityId);
  const candidateUserId = activity?.participantIds.find((userId) => userId !== DEFAULT_CURRENT_USER_ID) ?? "u-lin";
  const adapter = useMemo(() => createFeedbackAdapter(), []);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [abnormalText, setAbnormalText] = useState("");
  const [completionState, setCompletionState] = useState<FeedbackCompletionState>({
    hasSubmitted: false,
    isMutual: false,
    contactStateLabel: "等待反馈",
  });
  const [submitMessage, setSubmitMessage] = useState("正在同步反馈状态...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshCompletionState(nextMessage?: string) {
    const result = await runGetFeedbackCompletionState(adapter, activityId, candidateUserId);
    if (result.status === "ready") {
      setCompletionState(result.completionState);
      setSubmitMessage(nextMessage ?? "");
      return;
    }
    setSubmitMessage(result.message);
  }

  useEffect(() => {
    void refreshCompletionState();
  }, [activityId, candidateUserId, adapter]);

  function toggleSelection(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId],
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const result = await runSubmitFeedback(adapter, activityId, {
      selectedUserIds,
      abnormalText,
    });
    await refreshCompletionState(result.status === "ready" ? "反馈已提交，系统会同步互选状态。" : result.message);
    setIsSubmitting(false);
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">活动后反馈</Text>
      <Text className="flow-title">{activity?.title ?? "活动后互选"}</Text>
      {submitMessage ? <Text className="flow-message">{submitMessage}</Text> : null}

      <View className="flow-card">
        <Text className="card-title">活动后互选</Text>
        <Text className="card-copy">双方都选择，才开放联系。未互选不会打扰对方。</Text>
        <View className="selection-list">
          {(activity?.participantIds ?? []).map((userId) => (
            <Button
              className={selectedUserIds.includes(userId) ? "selection-button active" : "selection-button"}
              key={userId}
              onClick={() => toggleSelection(userId)}
            >
              {getUserDisplayName(userId)}
            </Button>
          ))}
        </View>
      </View>

      <View className="flow-card">
        <Text className="card-title">异常反馈</Text>
        <Textarea
          className="feedback-textarea"
          value={abnormalText}
          maxlength={120}
          placeholder="如有迟到、爽约、不舒服的互动，可以记录在这里"
          onInput={(event) => setAbnormalText(event.detail.value)}
        />
      </View>

      <Button className="primary-button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
        {isSubmitting ? "提交中" : "提交反馈"}
      </Button>

      <View className="result-card">
        <Text className="result-title">{completionState.contactStateLabel}</Text>
        <Text className="card-copy">
          {completionState.isMutual ? "你们互相选择了对方，后续可开放联系。" : "反馈已记录，系统会保护隐私边界。"}
        </Text>
      </View>
    </View>
  );
}
