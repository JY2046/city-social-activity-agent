import { Button, Text, View } from "@tarojs/components";
import type { Registration } from "@city-social/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { navigateTo, useDidShow, useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { createActivityReadAdapter, loadActivityDetail } from "../../services/activityReadService";
import { getSettlementByActivityId } from "../../services/mockData";
import { formatActivityDateTime, getCostLabel } from "../../services/activityPresentation";
import { getArrivalOptions, getPaymentActionLabel } from "../../services/flowViewModels";
import type { MiniProgramActivity } from "../../services/mockData";
import type { ArrivalStatus } from "../../services/registrationService";
import {
  createRegistrationWriteAdapter,
  runCancelSignupAndRefreshMyActivityFeed,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlistAndRefreshActivity,
} from "../../services/registrationWriteService";
import {
  createUserActivityReadAdapter,
  loadMyActivityFeed,
  loadMyRegistrationForActivity,
  type UserActivityItem,
} from "../../services/userActivityService";

import "../signup/index.css";
import "./index.css";

function getRegistrationStatusLabel(registration: Registration): string {
  if (registration.status === "waitlisted") {
    return "排队中";
  }

  if (registration.status === "arrived") {
    return "已到场";
  }

  if (registration.status === "noShow") {
    return "无法到场";
  }

  return "已报名";
}

export default function ItineraryPage() {
  const router = useRouter();
  const initialActivityId = typeof router.params.activityId === "string" ? router.params.activityId : undefined;
  const activityReadAdapter = useMemo(() => createActivityReadAdapter(), []);
  const userActivityReadAdapter = useMemo(() => createUserActivityReadAdapter(), []);
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(initialActivityId);
  const [myItems, setMyItems] = useState<UserActivityItem[]>([]);
  const [activity, setActivity] = useState<MiniProgramActivity | undefined>(() =>
    initialActivityId ? getActivity(initialActivityId) : undefined,
  );
  const [registration, setRegistration] = useState<Registration | undefined>();
  const [arrivalStatus, setArrivalStatus] = useState<ArrivalStatus>("confirmed");
  const [isJuZhangQueued, setIsJuZhangQueued] = useState(false);
  const [settlement, setSettlement] = useState(() =>
    initialActivityId ? getSettlementByActivityId(initialActivityId) : undefined,
  );
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [actionMessage, setActionMessage] = useState("");

  const refreshMyItems = useCallback(async () => {
    const result = await loadMyActivityFeed(userActivityReadAdapter);

    if (result.status === "ready") {
      setMyItems(result.items);
      setActionMessage("");
      return;
    }

    if (result.status === "empty") {
      setMyItems([]);
      setActionMessage("");
      return;
    }

    setMyItems([]);
    setActionMessage(result.message);
  }, [userActivityReadAdapter]);

  useEffect(() => {
    void refreshMyItems();
  }, [refreshMyItems]);

  useDidShow(() => {
    void refreshMyItems();
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSelectedActivity() {
      if (!selectedActivityId) {
        setActivity(undefined);
        setRegistration(undefined);
        setSettlement(undefined);
        return;
      }

      const [activityResult, registrationResult] = await Promise.all([
        loadActivityDetail(selectedActivityId, activityReadAdapter),
        loadMyRegistrationForActivity(selectedActivityId, userActivityReadAdapter),
      ]);

      if (!isMounted) {
        return;
      }

      if (activityResult.status === "ready") {
        setActivity(activityResult.activity);
        if (registrationResult.status === "ready") {
          setRegistration(registrationResult.registration);
          if (
            registrationResult.registration?.status === "confirmed" ||
            registrationResult.registration?.status === "arrived" ||
            registrationResult.registration?.status === "noShow"
          ) {
            setArrivalStatus(registrationResult.registration.status);
          }
        }
        setSettlement(getSettlementByActivityId(selectedActivityId));
        setActionMessage("");
        return;
      }

      if (activityResult.status === "empty") {
        setActivity(undefined);
        setRegistration(undefined);
        setActionMessage("活动不存在或暂不可查看");
        return;
      }

      if (activityResult.status === "error") {
        setActionMessage(activityResult.message);
        return;
      }

      if (registrationResult.status === "error") {
        setActionMessage(registrationResult.message);
      }
    }

    void loadSelectedActivity();

    return () => {
      isMounted = false;
    };
  }, [activityReadAdapter, selectedActivityId, userActivityReadAdapter]);

  async function handleArrival(status: ArrivalStatus) {
    if (!activity || !registration || registration.status === "waitlisted") {
      setActionMessage("只有已报名的活动可以同步到场状态。");
      return;
    }

    const adapter = createRegistrationWriteAdapter();
    setPendingAction(`arrival-${status}`);
    setActionMessage("");
    const arrivalResult = await runConfirmArrival(adapter, activity.id, status);
    setPendingAction(undefined);

    if (arrivalResult.status === "ready") {
      setRegistration(arrivalResult.registration);
      setArrivalStatus(status);
      return;
    }

    setActionMessage(arrivalResult.message);
  }

  async function handlePayment() {
    if (!activity || !registration || registration.status === "waitlisted") {
      setActionMessage("只有已报名的活动可以确认费用。");
      return;
    }

    const adapter = createRegistrationWriteAdapter();
    setPendingAction("payment");
    setActionMessage("");
    const paymentResult = await runConfirmPayment(adapter, activity.id);
    setPendingAction(undefined);

    if (paymentResult.status === "ready") {
      setSettlement(paymentResult.settlement);
      return;
    }

    setActionMessage(paymentResult.message);
  }

  async function handleJuZhangQueue() {
    if (!activity || !registration || registration.status === "waitlisted") {
      setActionMessage("只有已报名的活动可以申请局长。");
      return;
    }

    setPendingAction("juZhangQueue");
    setActionMessage("");
    const result = await runJoinWaitlistAndRefreshActivity(
      createRegistrationWriteAdapter(),
      activityReadAdapter,
      activity.id,
      "juZhang",
    );
    setPendingAction(undefined);

    if (result.status === "ready") {
      setIsJuZhangQueued(true);
      if (result.activity) {
        setActivity(result.activity);
      }
      if (result.refreshMessage) {
        setActionMessage(result.refreshMessage);
      }
      return;
    }

    setActionMessage(result.message);
  }

  async function handleCancelSignup() {
    if (!activity || !registration) {
      return;
    }

    setPendingAction("cancelSignup");
    setActionMessage("");
    const result = await runCancelSignupAndRefreshMyActivityFeed(
      createRegistrationWriteAdapter(),
      userActivityReadAdapter,
      activity.id,
    );
    setPendingAction(undefined);

    if (result.status === "ready") {
      if (result.items) {
        setMyItems(result.items);
      } else {
        setMyItems((current) => current.filter((item) => item.activity.id !== activity.id));
      }
      setSelectedActivityId(undefined);
      setActivity(undefined);
      setRegistration(undefined);
      setSettlement(undefined);
      setActionMessage(result.refreshMessage ?? "已取消报名，行程已更新。");
      return;
    }

    setActionMessage(result.message);
  }

  if (!selectedActivityId) {
    return (
      <View className="flow-page">
        <Text className="flow-eyebrow">我的行程</Text>
        <Text className="flow-title">已报名的小局</Text>

        {myItems.length > 0 ? (
          myItems.map((item) => (
            <View className="flow-card itinerary-list-card" key={item.registration.id}>
              <Text className="card-title">{item.activity.title}</Text>
              <Text className="card-copy">
                {formatActivityDateTime(item.activity.startsAt)} · {item.activity.area}
              </Text>
              <Text className="card-copy">
                {item.activity.venue} · {getRegistrationStatusLabel(item.registration)}
              </Text>
              <Button className="outline-button" onClick={() => setSelectedActivityId(item.activity.id)}>
                查看行程
              </Button>
            </View>
          ))
        ) : (
          <View className="flow-card">
            <Text className="card-title">还没有报名的小局</Text>
            <Text className="card-copy">去发现页挑一个感兴趣的活动，报名后会出现在这里。</Text>
          </View>
        )}

        {actionMessage ? <Text className="flow-message">{actionMessage}</Text> : null}
      </View>
    );
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
          {registration ? <Text className="card-copy">{getRegistrationStatusLabel(registration)}</Text> : null}
          {registration ? (
            <Button className="secondary-button itinerary-cancel-button" disabled={pendingAction !== undefined} onClick={handleCancelSignup}>
              {pendingAction === "cancelSignup" ? "取消中" : "取消报名"}
            </Button>
          ) : null}
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
          {pendingAction === "payment" ? "确认中" : getPaymentActionLabel(settlement, registration?.userId ?? "")}
        </Button>
      </View>

      {actionMessage ? <Text className="flow-message">{actionMessage}</Text> : null}

      <View className="bottom-link-row">
        <Text
          className="bottom-link"
          onClick={() => setSelectedActivityId(undefined)}
        >
          返回行程列表
        </Text>
      </View>

      <View className="bottom-link-row">
        <Text
          className="bottom-link"
          onClick={() => void navigateTo({ url: `/pages/activity-detail/index?activityId=${selectedActivityId}` })}
        >
          返回活动详情页
        </Text>
      </View>
    </View>
  );
}
