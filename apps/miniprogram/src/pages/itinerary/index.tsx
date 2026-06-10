import { Button, Text, View } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import { navigateTo, useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { createActivityReadAdapter, loadActivityDetail } from "../../services/activityReadService";
import { DEFAULT_CURRENT_USER_ID, getSettlementByActivityId } from "../../services/mockData";
import { formatActivityDateTime, getCostLabel } from "../../services/activityPresentation";
import { getArrivalOptions, getPaymentActionLabel } from "../../services/flowViewModels";
import type { MiniProgramActivity } from "../../services/mockData";
import type { ArrivalStatus } from "../../services/registrationService";
import {
  createRegistrationWriteAdapter,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlist,
  runSignup,
} from "../../services/registrationWriteService";

import "../signup/index.css";
import "./index.css";

export default function ItineraryPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-coffee";
  const activityReadAdapter = useMemo(() => createActivityReadAdapter(), []);
  const [activity, setActivity] = useState<MiniProgramActivity | undefined>(() => getActivity(activityId));
  const [arrivalStatus, setArrivalStatus] = useState<ArrivalStatus>("confirmed");
  const [isJuZhangQueued, setIsJuZhangQueued] = useState(false);
  const [settlement, setSettlement] = useState(() => getSettlementByActivityId(activityId));
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      const result = await loadActivityDetail(activityId, activityReadAdapter);

      if (!isMounted) {
        return;
      }

      if (result.status === "ready") {
        setActivity(result.activity);
        setActionMessage("");
        return;
      }

      if (result.status === "empty") {
        setActivity(undefined);
        setActionMessage("活动不存在或暂不可查看");
        return;
      }

      if (result.status === "error") {
        setActionMessage(result.message);
      }
    }

    void loadActivity();

    return () => {
      isMounted = false;
    };
  }, [activityId, activityReadAdapter]);

  async function handleArrival(status: ArrivalStatus) {
    if (!activity) {
      return;
    }

    const adapter = createRegistrationWriteAdapter();
    setPendingAction(`arrival-${status}`);
    setActionMessage("");
    const signupResult = await runSignup(adapter, activity.id, { willingToBeJuZhang: false });
    const arrivalResult =
      signupResult.status === "ready" ? await runConfirmArrival(adapter, activity.id, status) : signupResult;
    setPendingAction(undefined);

    if (arrivalResult.status === "ready") {
      setArrivalStatus(status);
      return;
    }

    setActionMessage(arrivalResult.message);
  }

  async function handlePayment() {
    if (!activity) {
      return;
    }

    const adapter = createRegistrationWriteAdapter();
    setPendingAction("payment");
    setActionMessage("");
    await runSignup(adapter, activity.id, { willingToBeJuZhang: false });
    const paymentResult = await runConfirmPayment(adapter, activity.id);
    setPendingAction(undefined);

    if (paymentResult.status === "ready") {
      setSettlement(paymentResult.settlement);
      return;
    }

    setActionMessage(paymentResult.message);
  }

  async function handleJuZhangQueue() {
    if (!activity) {
      return;
    }

    setPendingAction("juZhangQueue");
    setActionMessage("");
    const result = await runJoinWaitlist(createRegistrationWriteAdapter(), activity.id, "juZhang");
    setPendingAction(undefined);

    if (result.status === "ready") {
      setIsJuZhangQueued(true);
      return;
    }

    setActionMessage(result.message);
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
              disabled={pendingAction !== undefined}
              onClick={() => handleArrival(option.status)}
            >
              {pendingAction === `arrival-${option.status}` ? "同步中" : option.label}
            </Button>
          ))}
        </View>
      </View>

      <View className="flow-card">
        <Text className="card-title">局长申请</Text>
        <Text className="card-copy">如果该活动已有局长，会进入候选队列。</Text>
        <Button className="outline-button" disabled={pendingAction !== undefined} onClick={handleJuZhangQueue}>
          {pendingAction === "juZhangQueue" ? "提交中" : isJuZhangQueued ? "局长排队中" : "申请局长"}
        </Button>
      </View>

      <View className="flow-card">
        <Text className="card-title">费用确认</Text>
        <Text className="card-copy">普通参与者确认自己的费用和支付状态，局长再统一核准。</Text>
        <Button className="outline-button" disabled={pendingAction !== undefined} onClick={handlePayment}>
          {pendingAction === "payment" ? "确认中" : getPaymentActionLabel(settlement, DEFAULT_CURRENT_USER_ID)}
        </Button>
      </View>

      {actionMessage ? <Text className="flow-message">{actionMessage}</Text> : null}

      <View className="bottom-link-row">
        <Text
          className="bottom-link"
          onClick={() => void navigateTo({ url: `/pages/activity-detail/index?activityId=${activityId}` })}
        >
          返回活动详情页
        </Text>
      </View>
    </View>
  );
}
