import { Button, Text, View } from "@tarojs/components";
import { useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { DEFAULT_CURRENT_USER_ID, getSettlementByActivityId } from "../../services/mockData";
import { formatActivityDateTime, getCostLabel } from "../../services/activityPresentation";
import { getArrivalOptions, getPaymentActionLabel } from "../../services/flowViewModels";
import { confirmArrival, confirmPayment, joinWaitlist, signup, type ArrivalStatus } from "../../services/registrationService";

import "../signup/index.css";
import "./index.css";

export default function ItineraryPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-coffee";
  const activity = getActivity(activityId);
  const [arrivalStatus, setArrivalStatus] = useState<ArrivalStatus>("confirmed");
  const [isJuZhangQueued, setIsJuZhangQueued] = useState(false);
  const [settlement, setSettlement] = useState(activity ? getSettlementByActivityId(activity.id) : undefined);

  function handleArrival(status: ArrivalStatus) {
    if (!activity) {
      return;
    }

    signup(activity.id, { willingToBeJuZhang: false });
    confirmArrival(activity.id, status);
    setArrivalStatus(status);
  }

  function handlePayment() {
    if (!activity) {
      return;
    }

    signup(activity.id, { willingToBeJuZhang: false });
    setSettlement(confirmPayment(activity.id));
  }

  function handleJuZhangQueue() {
    if (!activity) {
      return;
    }

    joinWaitlist(activity.id, "juZhang");
    setIsJuZhangQueued(true);
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">我的行程</Text>
      <Text className="flow-title">{activity?.title ?? "活动不存在"}</Text>

      {activity ? (
        <View className="flow-card">
          <Text className="card-title">{formatActivityDateTime(activity.startsAt)}</Text>
          <Text className="card-copy">
            {activity.area} · {activity.venue}
          </Text>
          <Text className="card-copy">{getCostLabel(activity)}</Text>
        </View>
      ) : null}

      <View className="flow-card">
        <Text className="card-title">到场同步</Text>
        <View className="arrival-grid">
          {getArrivalOptions().map((option) => (
            <Button
              className={arrivalStatus === option.status ? "arrival-button active" : "arrival-button"}
              key={option.status}
              onClick={() => handleArrival(option.status)}
            >
              {option.label}
            </Button>
          ))}
        </View>
      </View>

      <View className="flow-card">
        <Text className="card-title">局长申请</Text>
        <Text className="card-copy">如果该活动已有局长，会进入候选队列。</Text>
        <Button className="outline-button" onClick={handleJuZhangQueue}>
          {isJuZhangQueued ? "局长排队中" : "申请局长"}
        </Button>
      </View>

      <View className="flow-card">
        <Text className="card-title">费用确认</Text>
        <Text className="card-copy">普通参与者确认自己的费用和支付状态，局长再统一核准。</Text>
        <Button className="outline-button" onClick={handlePayment}>
          {getPaymentActionLabel(settlement, DEFAULT_CURRENT_USER_ID)}
        </Button>
      </View>

      <View className="bottom-link-row">
        <Text className="bottom-link">返回活动详情页</Text>
      </View>
    </View>
  );
}
