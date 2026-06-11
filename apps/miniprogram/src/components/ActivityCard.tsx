import { Image, Text, View } from "@tarojs/components";
import type { Registration } from "@city-social/domain";

import {
  formatActivityDateTime,
  getActivityCtaLabel,
  getActivityCtaState,
  getActivityStatusLabel,
  getActivityTypeLabel,
  getCostLabel,
} from "../services/activityPresentation";
import type { MiniProgramActivity } from "../services/mockData";

import "./ActivityCard.css";

interface ActivityCardProps {
  activity: MiniProgramActivity;
  featured?: boolean;
  registration?: Registration;
  onClick?: (activity: MiniProgramActivity) => void;
}

export default function ActivityCard({ activity, featured = false, registration, onClick }: ActivityCardProps) {
  const ctaState = getActivityCtaState(activity, registration);
  const ctaClassName = ctaState.variant ? `featured-cta ${ctaState.variant}` : "featured-cta";
  const rowStatusLabel = registration ? ctaState.label : getActivityStatusLabel(activity);
  const rowStatusClassName = registration?.status === "waitlisted" ? "row-status queued" : "row-status";

  const handleClick = () => {
    onClick?.(activity);
  };

  if (featured) {
    return (
      <View className="featured-activity" onClick={handleClick}>
        <View className="featured-media">
          <Image className="featured-image" src={activity.coverImagePath} mode="aspectFill" />
          <View className="featured-overlay">
            <View className="featured-topline">
              <View className="featured-type-row">
                <Text className="type-chip">{getActivityTypeLabel(activity.type)}</Text>
                <Text className="headcount">
                  {activity.currentParticipantCount}/{activity.capacity} 人
                </Text>
              </View>
              <Text className="status-hot">{getActivityStatusLabel(activity)}</Text>
            </View>
            <Text className="featured-title">{activity.title}</Text>
            <Text className="featured-meta">
              {activity.area} · {activity.venue}
            </Text>
            <View className="featured-bottom">
              <Text className="featured-meta featured-meta-inline">
                {formatActivityDateTime(activity.startsAt)} · {getCostLabel(activity)}
              </Text>
              <Text className={ctaClassName}>{getActivityCtaLabel(activity, registration)}</Text>
            </View>
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
          <Text className={rowStatusClassName}>{rowStatusLabel}</Text>
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
