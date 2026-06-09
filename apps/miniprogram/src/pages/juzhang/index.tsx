import { Button, Text, View } from "@tarojs/components";
import { useState } from "react";
import { useRouter } from "@tarojs/taro";

import { getSettlementSummary } from "@city-social/domain";
import {
  acceptJuZhang,
  confirmParticipantArrival,
  confirmParticipantPayment,
  declineJuZhang,
  getJuZhangWorkspace,
} from "../../services/juZhangService";

import "../activity-detail/index.css";
import "./index.css";

export default function JuZhangPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const [workspace, setWorkspace] = useState(() => getJuZhangWorkspace(activityId));
  const settlementSummary = workspace.settlement ? getSettlementSummary(workspace.settlement) : undefined;

  function refreshWorkspace() {
    setWorkspace(getJuZhangWorkspace(activityId));
  }

  function handleAccept() {
    acceptJuZhang(activityId);
    refreshWorkspace();
  }

  function handleDecline() {
    declineJuZhang(activityId);
    refreshWorkspace();
  }

  function handleArrival(userId: string) {
    confirmParticipantArrival(activityId, userId, "arrived");
    refreshWorkspace();
  }

  function handlePayment(userId: string) {
    confirmParticipantPayment(activityId, userId);
    refreshWorkspace();
  }

  return (
    <View className="detail-page">
      <Text className="type-label">局长工作台</Text>
      <Text className="detail-title">{workspace.activity?.title ?? "开场、协调、AA 确认"}</Text>
      <Text className="detail-meta">系统会给任务提示，但局长只是协助流程，不承担额外压力。</Text>

      <View className="juzhang-banner">
        <Text className="banner-title">当前状态：{workspace.assignment?.status ?? "candidate"}</Text>
        <Text className="banner-copy">可接受或拒绝局长身份，拒绝不会退出活动。</Text>
        <View className="action-row">
          <Button className="accept-button" onClick={handleAccept}>
            接受局长
          </Button>
          <Button className="decline-button" onClick={handleDecline}>
            拒绝
          </Button>
        </View>
      </View>

      <View className="section">
        <View className="section-heading-row">
          <Text className="section-title">局长任务</Text>
          <Text className="tiny-chip">系统会提供指引</Text>
        </View>
        {workspace.tasks.map((task) => (
          <View className="task-card" key={task.title}>
            <Text className="highlight-title">{task.title}</Text>
            <Text className="section-copy">{task.description}</Text>
          </View>
        ))}
      </View>

      <View className="section topic-section">
        <Text className="section-title">AI 话题卡</Text>
        <Text className="topic-copy">{workspace.topicCard?.visibleText ?? "聊聊最近最想推荐给朋友的城市角落。"}</Text>
        <Text className="section-copy">这是开放式话题，活动中也可以换成大家自然聊起来的话题。</Text>
      </View>

      <View className="section">
        <Text className="section-title">到场核准</Text>
        {workspace.activeRegistrations.map((registration) => (
          <View className="participant-row" key={registration.id}>
            <Text className="participant-name">{registration.userId}</Text>
            <Text className="participant-status">{registration.status}</Text>
            <Button className="mini-action" onClick={() => handleArrival(registration.userId)}>
              确认到场
            </Button>
          </View>
        ))}
      </View>

      <View className="section">
        <View className="section-heading-row">
          <Text className="section-title">AA 确认</Text>
          <Text className="tiny-chip">{settlementSummary?.label ?? "无费用"}</Text>
        </View>
        {Object.entries(workspace.settlement?.paymentStatusByUser ?? {}).map(([userId, hasPaid]) => (
          <View className="participant-row" key={userId}>
            <Text className="participant-name">{userId}</Text>
            <Text className="participant-status">{hasPaid ? "已支付" : "待确认"}</Text>
            <Button className="mini-action" onClick={() => handlePayment(userId)}>
              确认支付
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
