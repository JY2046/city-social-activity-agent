import { View, Text } from "@tarojs/components";

import "../discover/index.css";

export default function WaitlistPage() {
  return (
    <View className="page page-light">
      <Text className="eyebrow">排队中</Text>
      <Text className="title">有名额会提醒你</Text>
      <View className="activity-card">
        <Text className="activity-title">活动排队与局长排队分开</Text>
        <Text className="reason">满员活动可以排队；已有局长时，也可以进入局长候选队列。</Text>
      </View>
    </View>
  );
}
