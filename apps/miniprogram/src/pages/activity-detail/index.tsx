import { View, Text } from "@tarojs/components";
import type { Registration } from "@city-social/domain";
import { navigateTo, switchTab, useRouter, useShareAppMessage } from "@tarojs/taro";
import { useEffect, useMemo, useState } from "react";
import DetailGallery from "../../components/DetailGallery";
import { loadActivityDetail, type ActivityDetailLoadState } from "../../services/activityReadService";
import {
  formatActivityDateTime,
  getActivityStatusLabel,
  getActivityTypeLabel,
  getCostLabel,
} from "../../services/activityPresentation";
import { getActivityDetailPrimaryActionState } from "../../services/flowViewModels";
import { createUserActivityReadAdapter, loadMyRegistrationForActivity } from "../../services/userActivityService";

import "./index.css";

const initialDetailState: ActivityDetailLoadState = {
  status: "loading",
  activity: undefined,
};

export default function ActivityDetailPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const userActivityReadAdapter = useMemo(() => createUserActivityReadAdapter(), []);
  const [detailState, setDetailState] = useState<ActivityDetailLoadState>(initialDetailState);
  const [registration, setRegistration] = useState<Registration | undefined>();
  const activity = detailState.activity;
  const primaryActionState = getActivityDetailPrimaryActionState(registration);
  const primaryActionClassName = primaryActionState.variant
    ? `primary-action ${primaryActionState.variant}`
    : "primary-action";

  useEffect(() => {
    let isMounted = true;

    setRegistration(undefined);
    void Promise.all([
      loadActivityDetail(activityId),
      loadMyRegistrationForActivity(activityId, userActivityReadAdapter),
    ]).then(([nextState, registrationState]) => {
      if (isMounted) {
        setDetailState(nextState);
        if (registrationState.status === "ready") {
          setRegistration(registrationState.registration);
          return;
        }

        setRegistration(undefined);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activityId, userActivityReadAdapter]);

  useShareAppMessage(() => ({
    title: activity?.title ?? "开个小局",
    path: `/pages/activity-detail/index?activityId=${activity?.id ?? activityId}`,
  }));

  if (detailState.status === "loading") {
    return (
      <View className="detail-page">
        <Text className="detail-state">正在打开这个小局...</Text>
      </View>
    );
  }

  if (detailState.status === "error") {
    return (
      <View className="detail-page">
        <Text className="detail-state">活动加载失败：{detailState.message}</Text>
      </View>
    );
  }

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
        <Text className="secondary-action" onClick={() => void switchTab({ url: "/pages/discover/index" })}>
          返回活动首页
        </Text>
        <Text
          className={primaryActionClassName}
          onClick={() => void navigateTo({ url: `/pages/signup/index?activityId=${activity.id}` })}
        >
          {primaryActionState.label}
        </Text>
      </View>
    </View>
  );
}
