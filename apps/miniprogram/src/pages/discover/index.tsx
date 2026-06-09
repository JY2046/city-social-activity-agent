import { View, Text } from "@tarojs/components";
import { mockActivities } from "@city-social/domain";

import "./index.css";

export default function DiscoverPage() {
  const featuredActivity = mockActivities[0];

  return (
    <View className="page page-light">
      <Text className="eyebrow">上海 · 先活动，后关系</Text>
      <Text className="title">发现城市里的小局</Text>
      <View className="activity-card">
        <Text className="pill">推荐</Text>
        <Text className="activity-title">{featuredActivity.title}</Text>
        <Text className="activity-meta">
          {featuredActivity.area} · {featuredActivity.venue}
        </Text>
        <Text className="activity-meta">
          {featuredActivity.currentParticipantCount}/{featuredActivity.capacity} 人 · 约 {featuredActivity.estimatedCost} 元
        </Text>
        <Text className="reason">{featuredActivity.aiRecommendationReason}</Text>
      </View>
    </View>
  );
}
