import { Button, Text, View } from "@tarojs/components";
import { useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { getWaitlistDescription, getWaitlistTitle } from "../../services/flowViewModels";
import { joinWaitlist } from "../../services/registrationService";
import type { WaitlistType } from "../../services/mockData";

import "../signup/index.css";
import "./index.css";

export default function WaitlistPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-bar";
  const waitlistType: WaitlistType = router.params.type === "juZhang" ? "juZhang" : "activity";
  const activity = getActivity(activityId);
  const [order, setOrder] = useState<number | undefined>();

  function handleJoinWaitlist() {
    if (!activity) {
      return;
    }

    setOrder(joinWaitlist(activity.id, waitlistType).order);
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">排队</Text>
      <Text className="flow-title">{getWaitlistTitle(waitlistType)}</Text>

      <View className="flow-card waitlist-card">
        <Text className="card-title">{activity?.title ?? "活动不存在"}</Text>
        <Text className="card-copy">{getWaitlistDescription(waitlistType)}</Text>
        <Button className="primary-button" disabled={!activity} onClick={handleJoinWaitlist}>
          {order ? `已排第 ${order} 位` : "加入排队"}
        </Button>
      </View>

      <View className="flow-card">
        <Text className="card-title">提醒状态</Text>
        <Text className="card-copy">后续接入订阅消息后，有名额或局长候选变化时会提醒。</Text>
      </View>
    </View>
  );
}
