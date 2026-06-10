import { Button, Text, View } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getSettlementSummary } from "@city-social/domain";
import { getJuZhangSettlementRows } from "../../services/flowViewModels";
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

import "../activity-detail/index.css";
import "./index.css";

export default function JuZhangPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const adapter = useMemo(() => createJuZhangAdapter(), []);
  const [workspace, setWorkspace] = useState<JuZhangWorkspace | undefined>();
  const [pageMessage, setPageMessage] = useState("正在同步局长工作台...");
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [topicDeck, setTopicDeck] = useState<TopicDeck | undefined>();
  const [confirmedPaymentUserIds, setConfirmedPaymentUserIds] = useState<string[]>([]);
  const settlementSummary = workspace?.settlement ? getSettlementSummary(workspace.settlement) : undefined;
  const settlementRows = getJuZhangSettlementRows(workspace?.settlement, getUserDisplayName, confirmedPaymentUserIds);

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
      <Text className="detail-title">{workspace?.activity?.title ?? "开场、协调、AA 确认"}</Text>
      <Text className="detail-meta">系统会给任务提示，但局长只是协助流程，不承担额外压力。</Text>
      {pageMessage ? <Text className="detail-meta">{pageMessage}</Text> : null}

      <View className="juzhang-banner">
        <Text className="banner-title">当前状态：{workspace?.assignment?.status ?? "candidate"}</Text>
        <Text className="banner-copy">可接受或拒绝局长身份，拒绝不会退出活动。</Text>
        <View className="action-row">
          <Button className="accept-button" disabled={pendingAction === "accept"} onClick={handleAccept}>
            {pendingAction === "accept" ? "同步中" : "接受局长"}
          </Button>
          <Button className="decline-button" disabled={pendingAction === "decline"} onClick={handleDecline}>
            {pendingAction === "decline" ? "同步中" : "拒绝"}
          </Button>
        </View>
      </View>

      <View className="section">
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
      </View>

      <View className="section topic-section">
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
      </View>

      <View className="section">
        <Text className="section-title">到场核准</Text>
        {(workspace?.activeRegistrations ?? []).map((registration) => (
          <View className="participant-row" key={registration.id}>
            <Text className="participant-name">{registration.userId}</Text>
            <Text className="participant-status">{registration.status}</Text>
            <Button
              className="mini-action"
              disabled={pendingAction === `arrival-${registration.userId}`}
              onClick={() => void handleArrival(registration.userId)}
            >
              {pendingAction === `arrival-${registration.userId}` ? "同步中" : "确认到场"}
            </Button>
          </View>
        ))}
      </View>

      <View className="section">
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
      </View>

      <View className="section">
        <Text className="section-title">活动后</Text>
        <Text className="section-copy">活动结束后进入反馈页，完成局长反馈、异常记录和互选。</Text>
      </View>
    </View>
  );
}
