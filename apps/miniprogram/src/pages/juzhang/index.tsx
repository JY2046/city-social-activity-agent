import { Button, Text, View } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import { navigateTo, useRouter } from "@tarojs/taro";

import { getSettlementSummary } from "@city-social/domain";
import {
  getActivityFlowPhase,
  getJuZhangBannerState,
  getJuZhangStageState,
  getJuZhangSettlementRows,
  getRegistrationStatusLabel,
  resolveActivityFlowPhase,
} from "../../services/flowViewModels";
import type { ActivityFlowPhase } from "../../services/flowViewModels";
import { getUserDisplayName } from "../../services/mockData";
import {
  createJuZhangAdapter,
  runAcceptJuZhang,
  runConfirmParticipantArrival,
  runConfirmParticipantPayment,
  runDeclineJuZhang,
  runLoadJuZhangWorkspace,
  type JuZhangWorkspace,
} from "../../services/juZhangService";
import {
  createTopicDeck,
  rotateTopicDeck,
  selectTopicFromHistory,
  type TopicDeck,
} from "../../services/topicDeckViewModel";
import { createRegistrationWriteAdapter, runCancelWaitlist } from "../../services/registrationWriteService";

import "../activity-detail/index.css";
import "./index.css";

const isStageDebugEnabled = __CITY_SOCIAL_ENABLE_STAGE_DEBUG__ !== "false";

export default function JuZhangPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const adapter = useMemo(() => createJuZhangAdapter(), []);
  const [workspace, setWorkspace] = useState<JuZhangWorkspace | undefined>();
  const [pageMessage, setPageMessage] = useState("正在同步局长工作台...");
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [topicDeck, setTopicDeck] = useState<TopicDeck | undefined>();
  const [stageOverride, setStageOverride] = useState<ActivityFlowPhase | undefined>();
  const [confirmedPaymentUserIds, setConfirmedPaymentUserIds] = useState<string[]>([]);
  const settlementSummary = workspace?.settlement ? getSettlementSummary(workspace.settlement) : undefined;
  const settlementRows = getJuZhangSettlementRows(workspace?.settlement, getUserDisplayName, confirmedPaymentUserIds);
  const activityPhase = workspace?.activity ? resolveActivityFlowPhase(workspace.activity, stageOverride) : undefined;
  const stageState = activityPhase ? getJuZhangStageState(activityPhase) : undefined;
  const bannerState = workspace?.activity
    ? getJuZhangBannerState({
        assignment: workspace.assignment,
        currentUserId: workspace.currentUserId,
        currentRegistration: workspace.currentRegistration,
        isQueued: workspace.juZhangWaitlistEntry?.status === "waiting",
      })
    : undefined;

  async function refreshWorkspace(nextMessage?: string) {
    const result = await runLoadJuZhangWorkspace(adapter, activityId);
    if (result.status === "ready") {
      setWorkspace(result.workspace);
      if (result.workspace.activity) {
        setTopicDeck((deck) => deck ?? createTopicDeck(result.workspace.activity, result.workspace.topicCard));
      }
      setPageMessage(nextMessage ?? "");
      return;
    }
    setPageMessage(result.message);
  }

  useEffect(() => {
    void refreshWorkspace();
  }, [activityId, adapter]);

  async function handleAccept() {
    setPendingAction("accept");
    const result = await runAcceptJuZhang(adapter, activityId);
    await refreshWorkspace(result.status === "ready" ? "已接受局长身份，系统会继续给你任务提示。" : result.message);
    setPendingAction(undefined);
  }

  async function handleDecline() {
    setPendingAction("decline");
    const result = await runDeclineJuZhang(adapter, activityId);
    await refreshWorkspace(result.status === "ready" ? "已拒绝局长身份，你仍然保留活动报名。" : result.message);
    setPendingAction(undefined);
  }

  function handleJoinJuZhangQueue() {
    if (!workspace?.activity) {
      return;
    }

    if (bannerState?.mode === "queued") {
      void handleCancelJuZhangQueue();
      return;
    }

    void navigateTo({
      url: `/pages/waitlist/index?activityId=${encodeURIComponent(workspace.activity.id)}&type=juZhang`,
    });
  }

  async function handleCancelJuZhangQueue() {
    if (!workspace?.activity) {
      return;
    }

    setPendingAction("cancelJuZhangQueue");
    const result = await runCancelWaitlist(createRegistrationWriteAdapter(), workspace.activity.id, "juZhang");
    await refreshWorkspace(result.status === "ready" ? "已取消局长候选排队。" : result.message);
    setPendingAction(undefined);
  }

  async function handleArrival(userId: string) {
    setPendingAction(`arrival-${userId}`);
    const result = await runConfirmParticipantArrival(adapter, activityId, userId);
    await refreshWorkspace(result.status === "ready" ? "已更新到场状态。" : result.message);
    setPendingAction(undefined);
  }

  async function handlePayment(userId: string) {
    setPendingAction(`payment-${userId}`);
    const result = await runConfirmParticipantPayment(adapter, activityId, userId);
    await refreshWorkspace(result.status === "ready" ? "已确认该成员完成支付。" : result.message);
    if (result.status === "ready") {
      setConfirmedPaymentUserIds((userIds) => (userIds.includes(userId) ? userIds : [...userIds, userId]));
    }
    setPendingAction(undefined);
  }

  return (
      <View className="detail-page">
      <Text className="type-label">局长工作台</Text>
      <Text className="detail-title">{workspace?.activity?.title ?? "暂无可管理的小局"}</Text>
      {workspace?.activity ? <Text className="detail-meta">系统会给任务提示，但局长只是协助流程，不承担额外压力。</Text> : null}
      {pageMessage ? <Text className="detail-meta">{pageMessage}</Text> : null}

      {!workspace?.activity ? (
        <View className="section">
          <Text className="section-title">暂无可管理的小局</Text>
          <Text className="section-copy">取消报名后，对应活动不会继续出现在局长工作台。</Text>
        </View>
      ) : null}

      {workspace?.activity ? <View className="juzhang-banner">
        <Text className="banner-title">{bannerState?.title}</Text>
        <Text className="banner-copy">{bannerState?.copy}</Text>
        {bannerState?.mode === "respond" ? (
          <View className="action-row">
            <Button className="accept-button" disabled={pendingAction === "accept"} onClick={handleAccept}>
              {pendingAction === "accept" ? "同步中" : bannerState.primaryLabel}
            </Button>
            <Button className="decline-button" disabled={pendingAction === "decline"} onClick={handleDecline}>
              {pendingAction === "decline" ? "同步中" : bannerState.secondaryLabel}
            </Button>
          </View>
        ) : null}
        {bannerState?.mode === "queue" || bannerState?.mode === "queued" ? (
          <View className="action-row">
            <Button
              className="accept-button"
              disabled={pendingAction === "cancelJuZhangQueue"}
              onClick={handleJoinJuZhangQueue}
            >
              {pendingAction === "cancelJuZhangQueue" ? "取消中" : bannerState.primaryLabel}
            </Button>
          </View>
        ) : null}
      </View> : null}

      {isStageDebugEnabled && workspace?.activity ? (
        <View className="section debug-stage-card">
          <Text className="section-title">测试阶段切换</Text>
          <Text className="section-copy">仅测试阶段显示，用于预览局长工作台的活动前、活动中、活动后。</Text>
          <View className="debug-stage-row">
            {(["before", "during", "after"] as ActivityFlowPhase[]).map((phase) => (
              <Button
                className={activityPhase === phase ? "debug-stage-button active" : "debug-stage-button"}
                key={phase}
                onClick={() =>
                  setStageOverride(phase === getActivityFlowPhase(workspace.activity) ? undefined : phase)
                }
              >
                {phase === "before" ? "活动前" : phase === "during" ? "活动中" : "活动后"}
              </Button>
            ))}
          </View>
        </View>
      ) : null}

      {workspace?.activity && stageState?.showBeforeInfo ? <View className="section">
        <Text className="section-title">活动前准备</Text>
        <Text className="section-copy">活动前先不用处理开场、到场和 AA；系统会在临近开始时再提示你。</Text>
        <Text className="section-copy">可以先确认集合地点、时间，以及是否需要提前到场。</Text>
      </View> : null}

      {workspace?.activity && stageState?.showTaskCards ? <View className="section">
        <View className="section-heading-row">
          <Text className="section-title">局长任务</Text>
          <Text className="tiny-chip">系统会提供指引</Text>
        </View>
        {(workspace?.tasks ?? []).map((task) => (
          <View className="task-card" key={task.title}>
            <Text className="highlight-title">{task.title}</Text>
            <Text className="section-copy">{task.description}</Text>
          </View>
        ))}
      </View> : null}

      {workspace?.activity && stageState?.showTopicCard ? <View className="section topic-section">
        <View className="section-heading-row">
          <Text className="section-title">AI 话题卡</Text>
          <Button className="topic-action top-right" onClick={() => setTopicDeck((deck) => (deck ? rotateTopicDeck(deck) : deck))}>
            换一张
          </Button>
        </View>
        <Text className="topic-copy">
          {topicDeck?.current.visibleText ?? workspace?.topicCard?.visibleText ?? "聊聊最近最想推荐给朋友的城市角落。"}
        </Text>
        <Text className="section-copy">这是开放式话题，活动中也可以换成大家自然聊起来的话题。</Text>
        <View className="topic-history">
          {(topicDeck?.history ?? []).map((topic, index) => (
            <Text
              className={topic.id === topicDeck?.current.id ? "history-chip active" : "history-chip"}
              key={topic.id}
              onClick={() => setTopicDeck((deck) => (deck ? selectTopicFromHistory(deck, topic.id) : deck))}
            >
              话题 {index + 1}
            </Text>
          ))}
        </View>
      </View> : null}

      {workspace?.activity && stageState?.showArrivalCheck ? <View className="section">
        <Text className="section-title">到场核准</Text>
        {(workspace?.activeRegistrations ?? []).map((registration) => (
          <View className="participant-row" key={registration.id}>
            <Text className="participant-name">{registration.userId}</Text>
            <Text className="participant-status">{getRegistrationStatusLabel(registration.status)}</Text>
            <Button
              className="mini-action"
              disabled={pendingAction === `arrival-${registration.userId}`}
              onClick={() => void handleArrival(registration.userId)}
            >
              {pendingAction === `arrival-${registration.userId}` ? "同步中" : "确认到场"}
            </Button>
          </View>
        ))}
      </View> : null}

      {workspace?.activity && stageState?.showSettlement ? <View className="section">
        <View className="section-heading-row">
          <Text className="section-title">AA 确认</Text>
          <Text className="tiny-chip">{settlementSummary?.label ?? "无费用"}</Text>
        </View>
        {settlementRows.map((row) => (
          <View className="participant-row" key={row.userId}>
            <Text className="participant-name">{row.displayName}</Text>
            <Text className={row.canConfirm ? "participant-status waiting" : "participant-status paid"}>
              {row.participantPaymentLabel}
            </Text>
            <Button
              className={row.canConfirm ? "mini-action" : "mini-action confirmed"}
              disabled={!row.canConfirm || pendingAction === `payment-${row.userId}`}
              onClick={() => void handlePayment(row.userId)}
            >
              {pendingAction === `payment-${row.userId}` ? "同步中" : row.juZhangActionLabel}
            </Button>
          </View>
        ))}
      </View> : null}

      {workspace?.activity && stageState?.showAfterFeedback ? <View className="section">
        <Text className="section-title">活动后</Text>
        <Text className="section-copy">活动结束后进入反馈页，完成局长反馈、异常记录和互选。</Text>
        <Button
          className="accept-button"
          onClick={() => void navigateTo({ url: `/pages/feedback/index?activityId=${encodeURIComponent(workspace.activity.id)}` })}
        >
          去反馈
        </Button>
      </View> : null}
    </View>
  );
}
