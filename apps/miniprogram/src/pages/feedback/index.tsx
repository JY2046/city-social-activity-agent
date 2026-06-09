import { View, Text } from "@tarojs/components";

import "../discover/index.css";

export default function FeedbackPage() {
  return (
    <View className="page page-light">
      <Text className="eyebrow">活动后互选</Text>
      <Text className="title">双方都选择，才开放联系</Text>
      <View className="activity-card">
        <Text className="activity-title">反馈也用于保护活动体验</Text>
        <Text className="reason">可以选择想继续认识的人，也可以提交异常反馈。</Text>
      </View>
    </View>
  );
}
