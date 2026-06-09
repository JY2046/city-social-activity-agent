import { View, Text } from "@tarojs/components";
import { useRouter, useShareAppMessage } from "@tarojs/taro";
import DetailGallery from "../../components/DetailGallery";
import { getActivity } from "../../services/activityService";
import {
  formatActivityDateTime,
  getActivityStatusLabel,
  getActivityTypeLabel,
  getCostLabel,
} from "../../services/activityPresentation";

import "./index.css";

export default function ActivityDetailPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const activity = getActivity(activityId);

  useShareAppMessage(() => ({
    title: activity?.title ?? "先活动，后关系",
    path: `/pages/activity-detail/index?activityId=${activity?.id ?? activityId}`,
  }));

  if (!activity) {
    return (
      <View className="detail-page">
        <Text className="detail-title">活动不存在</Text>
      </View>
    );
  }

  return (
    <View className="detail-page">
      <View className="hero-panel">
        <Text className="type-label">{getActivityTypeLabel(activity.type)}</Text>
        <Text className="detail-title">{activity.title}</Text>
        <Text className="detail-meta">
          {activity.area} · {activity.venue}
        </Text>
        <Text className="detail-meta">{formatActivityDateTime(activity.startsAt)}</Text>
        <Text className="detail-meta">
          {activity.currentParticipantCount}/{activity.capacity} 人 · {getActivityStatusLabel(activity)}
        </Text>
        <Text className="detail-meta">人均 {getCostLabel(activity).replace("约 ", "")}</Text>
      </View>

      <DetailGallery items={activity.gallery} />

      <View className="section">
        <Text className="section-title">种草理由</Text>
        <Text className="section-copy">{activity.attractionSummary}</Text>
      </View>

      <View className="section">
        <Text className="section-title">活动亮点</Text>
        {activity.experienceHighlights.map((highlight) => (
          <View className="highlight-item" key={highlight.title}>
            <Text className="highlight-title">{highlight.title}</Text>
            <Text className="section-copy">{highlight.description}</Text>
          </View>
        ))}
      </View>

      <View className="section">
        <Text className="section-title">位置与费用</Text>
        <Text className="section-copy">{activity.locationGuide}</Text>
        <Text className="section-copy">{activity.aaRule}</Text>
      </View>

      <View className="bottom-actions">
        <Text className="secondary-action">返回活动首页</Text>
        <Text className="primary-action">确认报名</Text>
      </View>
    </View>
  );
}
