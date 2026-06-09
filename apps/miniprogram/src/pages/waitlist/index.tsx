import { Button, Text, View } from "@tarojs/components";
import { useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { getWaitlistDescription, getWaitlistTitle } from "../../services/flowViewModels";
import { createRegistrationWriteAdapter, runJoinWaitlist } from "../../services/registrationWriteService";
import type { WaitlistType } from "../../services/mockData";

import "../signup/index.css";
import "./index.css";

export default function WaitlistPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-bar";
  const waitlistType: WaitlistType = router.params.type === "juZhang" ? "juZhang" : "activity";
  const activity = getActivity(activityId);
  const [order, setOrder] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  async function handleJoinWaitlist() {
    if (!activity) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    const result = await runJoinWaitlist(createRegistrationWriteAdapter(), activity.id, waitlistType);
    setIsSubmitting(false);

    if (result.status === "ready") {
      setOrder(result.waitlistEntry.order);
      return;
    }

    setSubmitMessage(result.message);
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">排队</Text>
      <Text className="flow-title">{getWaitlistTitle(waitlistType)}</Text>

      <View className="flow-card waitlist-card">
        <Text className="card-title">{activity?.title ?? "活动不存在"}</Text>
        <Text className="card-copy">{getWaitlistDescription(waitlistType)}</Text>
        <Button className="primary-button" disabled={!activity || isSubmitting} onClick={handleJoinWaitlist}>
          {isSubmitting ? "提交中" : order ? `已排第 ${order} 位` : "加入排队"}
        </Button>
        {submitMessage ? <Text className="flow-message">{submitMessage}</Text> : null}
      </View>

      <View className="flow-card">
        <Text className="card-title">提醒状态</Text>
        <Text className="card-copy">后续接入订阅消息后，有名额或局长候选变化时会提醒。</Text>
      </View>
    </View>
  );
}
