import { View, Text } from "@tarojs/components";
import { mockActivities } from "@city-social/domain";

import "./index.css";

export default function ActivityDetailPage() {
  const activity = mockActivities[0];

  return (
    <View className="detail-page">
      <Text className="type-label">饭局</Text>
      <Text className="detail-title">{activity.title}</Text>
      <Text className="detail-meta">
        {activity.area} · {activity.venue}
      </Text>
      <Text className="detail-meta">
        {activity.currentParticipantCount}/{activity.capacity} 人 · 人均约 {activity.estimatedCost} 元
      </Text>
      <View className="section">
        <Text className="section-title">种草理由</Text>
        <Text className="section-copy">{activity.attractionSummary}</Text>
      </View>
    </View>
  );
}
