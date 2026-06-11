import { Button, Text, View } from "@tarojs/components";
import type { Registration } from "@city-social/domain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { navigateTo, useDidShow, useRouter } from "@tarojs/taro";

import { getActivity } from "../../services/activityService";
import { buildActivityDetailUrl, readActivityIdParam } from "../../services/activityRouteService";
import { createActivityReadAdapter, loadActivityDetail } from "../../services/activityReadService";
import { getSettlementByActivityId } from "../../services/mockData";
import { formatActivityDateTime, getCostLabel } from "../../services/activityPresentation";
import {
  getActivityFlowPhase,
  getArrivalOptions,
  getItineraryStageState,
  getJuZhangQueueActionState,
  getPaymentActionLabel,
  resolveActivityFlowPhase,
} from "../../services/flowViewModels";
import type { ActivityFlowPhase } from "../../services/flowViewModels";
import type { MiniProgramActivity } from "../../services/mockData";
import type { ArrivalStatus } from "../../services/registrationService";
import {
  createRegistrationWriteAdapter,
  runCancelSignupAndRefreshMyActivityFeed,
  runCancelWaitlist,
  runConfirmArrival,
  runConfirmPayment,
  runJoinWaitlistAndRefreshActivity,
} from "../../services/registrationWriteService";
import { createJuZhangAdapter, runLoadJuZhangWorkspace } from "../../services/juZhangService";
import {
  createUserActivityReadAdapter,
  loadMyActivityFeed,
  loadMyRegistrationForActivity,
  type UserActivityItem,
} from "../../services/userActivityService";

import "../signup/index.css";
import "./index.css";

const isStageDebugEnabled = __CITY_SOCIAL_ENABLE_STAGE_DEBUG__ !== "false";

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
  const initialActivityId = router.params.activityId ? readActivityIdParam(router.params.activityId) : undefined;
  const activityReadAdapter = useMemo(() => createActivityReadAdapter(), []);
  const userActivityReadAdapter = useMemo(() => createUserActivityReadAdapter(), []);
  const juZhangAdapter = useMemo(() => createJuZhangAdapter(), []);
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
  const [stageOverride, setStageOverride] = useState<ActivityFlowPhase | undefined>();
  const activityPhase = activity ? resolveActivityFlowPhase(activity, stageOverride) : undefined;
  const stageState = activityPhase ? getItineraryStageState(activityPhase) : undefined;
  const queueActionState = getJuZhangQueueActionState(registration, isJuZhangQueued);
  const shouldShowActivityDetailReturn = Boolean(selectedActivityId && activity);

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
        setStageOverride(undefined);
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
          const workspaceResult = await runLoadJuZhangWorkspace(juZhangAdapter, selectedActivityId);
          setIsJuZhangQueued(
            workspaceResult.status === "ready" && workspaceResult.workspace.juZhangWaitlistEntry?.status === "waiting",
          );
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
        setIsJuZhangQueued(false);
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
  }, [activityReadAdapter, juZhangAdapter, selectedActivityId, userActivityReadAdapter]);

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

    if (!isJuZhangQueued && !registration.willingToBeJuZhang) {
      setActionMessage("你报名时没有勾选愿意担任局长，不会进入局长候选队列。");
      return;
    }

    setPendingAction("juZhangQueue");
    setActionMessage("");
    const writeAdapter = createRegistrationWriteAdapter();

    if (isJuZhangQueued) {
      const result = await runCancelWaitlist(writeAdapter, activity.id, "juZhang");
      setPendingAction(undefined);

      if (result.status === "ready") {
        setIsJuZhangQueued(false);
        setActionMessage("已取消局长候选排队。");
        return;
      }

      setActionMessage(result.message);
      return;
    }

    const result = await runJoinWaitlistAndRefreshActivity(writeAdapter, activityReadAdapter, activity.id, "juZhang");
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
      setIsJuZhangQueued(false);
      setStageOverride(undefined);
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
              <Button
                className="outline-button"
                onClick={() => {
                  setStageOverride(undefined);
                  setSelectedActivityId(item.activity.id);
                }}
              >
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
      <Text
        className="top-back"
        onClick={() => {
          setStageOverride(undefined);
          setSelectedActivityId(undefined);
        }}
      >
        返回行程列表
      </Text>
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

      {stageState?.showBeforeInfo ? <View className="flow-card">
        <Text className="card-title">活动前准备</Text>
        <Text className="card-copy">活动前不开放联系方式；活动开始前 30 分钟可同步到场状态。</Text>
        <Text className="card-copy">需要变更计划时，请在规则允许时间内取消报名。</Text>
      </View> : null}

      {isStageDebugEnabled && activity ? (
        <View className="flow-card debug-stage-card">
          <Text className="card-title">测试阶段切换</Text>
          <Text className="card-copy">仅测试阶段显示，用于预览活动前、活动中、活动后的页面状态。</Text>
          <View className="debug-stage-row">
            {(["before", "during", "after"] as ActivityFlowPhase[]).map((phase) => (
              <Button
                className={activityPhase === phase ? "debug-stage-button active" : "debug-stage-button"}
                key={phase}
                onClick={() => setStageOverride(phase === getActivityFlowPhase(activity) ? undefined : phase)}
              >
                {phase === "before" ? "活动前" : phase === "during" ? "活动中" : "活动后"}
              </Button>
            ))}
          </View>
        </View>
      ) : null}

      {stageState?.showArrivalSync ? <View className="flow-card">
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
      </View> : null}

      {stageState?.showJuZhangApplication ? <View className="flow-card">
        <Text className="card-title">局长申请</Text>
        <Text className="card-copy">{queueActionState.copy}</Text>
        <Button
          className="outline-button"
          disabled={pendingAction !== undefined || queueActionState.disabled}
          onClick={handleJuZhangQueue}
        >
          {pendingAction === "juZhangQueue" ? "提交中" : queueActionState.label}
        </Button>
      </View> : null}

      {stageState?.showPayment ? <View className="flow-card">
        <Text className="card-title">费用确认</Text>
        <Text className="card-copy">普通参与者确认自己的费用和支付状态，局长再统一核准。</Text>
        <Button className="outline-button" disabled={pendingAction !== undefined} onClick={handlePayment}>
          {pendingAction === "payment" ? "确认中" : getPaymentActionLabel(settlement, registration?.userId ?? "")}
        </Button>
      </View> : null}

      {stageState?.showFeedback ? <View className="flow-card">
        <Text className="card-title">活动后反馈</Text>
        <Text className="card-copy">活动结束后开放反馈和互选，双方同意后才开放联系。</Text>
        <Button
          className="outline-button"
          onClick={() => void navigateTo({ url: `/pages/feedback/index?activityId=${encodeURIComponent(selectedActivityId)}` })}
        >
          去反馈
        </Button>
      </View> : null}

      {actionMessage ? <Text className="flow-message">{actionMessage}</Text> : null}

      {shouldShowActivityDetailReturn ? <View className="bottom-link-row">
        <Text
          className="bottom-link"
          onClick={() => void navigateTo({ url: buildActivityDetailUrl(selectedActivityId) })}
        >
          返回活动详情页
        </Text>
      </View> : null}
    </View>
  );
}
