import { View, Text } from "@tarojs/components";

import "../activity-detail/index.css";

export default function JuZhangPage() {
  return (
    <View className="detail-page">
      <Text className="type-label">局长工作台</Text>
      <Text className="detail-title">开场、协调、AA 确认</Text>
      <Text className="detail-meta">系统会给任务提示，但局长只是协助流程，不承担额外压力。</Text>
      <View className="section">
        <Text className="section-title">今日任务</Text>
        <Text className="section-copy">确认到场、使用话题卡破冰、活动后确认每个人的支付状态。</Text>
      </View>
    </View>
  );
}
