import { Image, Text, View } from "@tarojs/components";

import {
  formatActivityDateTime,
  getActivityCtaLabel,
  getActivityStatusLabel,
  getActivityTypeLabel,
  getCostLabel,
} from "../services/activityPresentation";
import type { MiniProgramActivity } from "../services/mockData";

import "./ActivityCard.css";

interface ActivityCardProps {
  activity: MiniProgramActivity;
  featured?: boolean;
  onClick?: (activity: MiniProgramActivity) => void;
}

export default function ActivityCard({ activity, featured = false, onClick }: ActivityCardProps) {
  const handleClick = () => {
    onClick?.(activity);
  };

  if (featured) {
    return (
      <View className="featured-activity" onClick={handleClick}>
        <View className="featured-media">
          <Image className="featured-image" src={activity.coverImagePath} mode="aspectFill" />
          <View className="featured-overlay">
            <Text className="status-hot">{getActivityStatusLabel(activity)}</Text>
            <View className="featured-type-row">
              <Text className="type-chip">{getActivityTypeLabel(activity.type)}</Text>
              <Text className="headcount">
                {activity.currentParticipantCount}/{activity.capacity} 人
              </Text>
            </View>
            <Text className="featured-title">{activity.title}</Text>
            <Text className="featured-meta">
              {activity.area} · {activity.venue}
            </Text>
            <View className="featured-bottom">
              <Text className="featured-meta featured-meta-inline">
                {formatActivityDateTime(activity.startsAt)} · {getCostLabel(activity)}
              </Text>
            </View>
            <Text className="featured-cta">{getActivityCtaLabel(activity)}</Text>
          </View>
        </View>
        <View className="ai-strip">
          <Text className="ai-copy">{activity.aiRecommendationReason}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="activity-row-card" onClick={handleClick}>
      <Image className="row-image" src={activity.coverImagePath} mode="aspectFill" />
      <View className="row-content">
        <View className="row-topline">
          <Text className="row-type">{getActivityTypeLabel(activity.type)}</Text>
          <Text className="row-status">{getActivityStatusLabel(activity)}</Text>
        </View>
        <Text className="row-title">{activity.title}</Text>
        <Text className="row-meta">
          {activity.area} · {activity.venue}
        </Text>
        <Text className="row-meta">
          {formatActivityDateTime(activity.startsAt)} · {getCostLabel(activity)}
        </Text>
        <Text className="row-reason">{activity.aiRecommendationReason}</Text>
      </View>
    </View>
  );
}
