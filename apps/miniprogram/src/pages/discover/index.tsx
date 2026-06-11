import { Image, Picker, View, Text } from "@tarojs/components";
import { navigateTo, useDidShow } from "@tarojs/taro";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityType, BudgetType, Registration } from "@city-social/domain";

import ActivityCard from "../../components/ActivityCard";
import { buildActivityDetailUrl } from "../../services/activityRouteService";
import { getActivityFeedPage } from "../../services/activityFeedPagination";
import { loadActivityFeed, type ActivityFeedLoadState } from "../../services/activityReadService";
import { cityOptions, getCityFromPickerIndex, getCityPickerIndex } from "../../services/citySelectorViewModel";
import type { MiniProgramActivity } from "../../services/mockData";
import { formatBeijingDateTime } from "../../services/homeHeroViewModel";
import { createUserActivityReadAdapter } from "../../services/userActivityService";

import "./index.css";

const initialFeedState: ActivityFeedLoadState = {
  status: "loading",
  activities: [],
};

const activityPageSize = 5;

type CategoryKey = "recommended" | ActivityType | "free";

interface CategoryOption {
  key: CategoryKey;
  label: string;
  type?: ActivityType;
  budgetType?: BudgetType;
}

const categoryOptions: CategoryOption[] = [
  { key: "recommended", label: "推荐" },
  { key: "dinner", label: "饭局", type: "dinner" },
  { key: "coffee", label: "咖啡", type: "coffee" },
  { key: "bar", label: "酒吧", type: "bar" },
  { key: "free", label: "免费活动", budgetType: "free" },
];

export default function DiscoverPage() {
  const [feedState, setFeedState] = useState<ActivityFeedLoadState>(initialFeedState);
  const [selectedCity, setSelectedCity] = useState("上海");
  const [currentDateTime, setCurrentDateTime] = useState(() => formatBeijingDateTime());
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("recommended");
  const [visibleActivityCount, setVisibleActivityCount] = useState(activityPageSize);
  const userActivityReadAdapter = useMemo(() => createUserActivityReadAdapter(), []);
  const [registrationByActivityId, setRegistrationByActivityId] = useState<Record<string, Registration>>({});
  const { visibleActivities, hasMore, nextVisibleCount } = getActivityFeedPage(
    feedState.activities,
    visibleActivityCount,
    activityPageSize,
  );
  const [featuredActivity, ...activityList] = visibleActivities;

  const refreshFeed = useCallback(() => {
    let isMounted = true;
    const category = categoryOptions.find((option) => option.key === selectedCategory);

    setFeedState(initialFeedState);
    setVisibleActivityCount(activityPageSize);

    void Promise.all([
      loadActivityFeed(undefined, {
        city: selectedCity,
        type: category?.type,
        budgetType: category?.budgetType,
      }),
      userActivityReadAdapter.listMyRegistrations().catch(() => []),
    ]).then(([nextState, registrations]) => {
      if (isMounted) {
        setFeedState(nextState);
        setRegistrationByActivityId(
          Object.fromEntries(registrations.map((registration) => [registration.activityId, registration])),
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedCity, userActivityReadAdapter]);

  useEffect(() => refreshFeed(), [refreshFeed]);

  useDidShow(() => {
    refreshFeed();
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(formatBeijingDateTime()), 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  function handleOpenActivity(activity: MiniProgramActivity) {
    void navigateTo({ url: buildActivityDetailUrl(activity.id) });
  }

  return (
    <View className="page page-light">
      <View className="home-hero">
        <Image className="hero-skyline" src="/assets/images/city-skyline.jpg" mode="aspectFill" />
        <View className="hero-content">
          <View className="location-line">
            <Picker
              mode="selector"
              range={cityOptions}
              value={getCityPickerIndex(selectedCity)}
              onChange={(event) => {
                setVisibleActivityCount(activityPageSize);
                setSelectedCity(getCityFromPickerIndex(event.detail.value));
              }}
            >
              <Text className="location-city">{selectedCity}⌄</Text>
            </Picker>
            <Text className="eyebrow">{currentDateTime}</Text>
          </View>
          <Text className="title">
            有空，<Text className="title-accent">开个小局</Text>
          </Text>
          <Text className="subtitle">饭局、咖啡、散步，和陌生人轻松见一面</Text>
        </View>
      </View>

      <View className="search-row">
        <Text className="search-box">搜索活动、地点</Text>
        <Text className="filter-button">筛选</Text>
      </View>

      <View className="category-row">
        {categoryOptions.map((category) => (
          <Text
            className={selectedCategory === category.key ? "category-active" : "category"}
            key={category.key}
            onClick={() => {
              setVisibleActivityCount(activityPageSize);
              setSelectedCategory(category.key);
            }}
          >
            {category.label}
          </Text>
        ))}
      </View>

      {feedState.status === "loading" ? <Text className="feed-state">正在打开今天的小局...</Text> : null}
      {feedState.status === "error" ? <Text className="feed-state">活动加载失败：{feedState.message}</Text> : null}
      {feedState.status === "empty" ? <Text className="feed-state">今天的小局还在准备中</Text> : null}

      {featuredActivity ? (
        <ActivityCard
          activity={featuredActivity}
          featured
          registration={registrationByActivityId[featuredActivity.id]}
          onClick={handleOpenActivity}
        />
      ) : null}

      <View className="trust-strip">
        <View className="trust-item trust-privacy">
          <Text className="trust-title">活动前不开放</Text>
          <Text className="trust-copy">联系方式</Text>
        </View>
        <View className="trust-item trust-match">
          <Text className="trust-title">活动后互选</Text>
          <Text className="trust-copy">双向同意才开放联系</Text>
        </View>
        <View className="trust-item trust-juzhang">
          <Text className="trust-title">局长</Text>
          <Text className="trust-copy">协助流程 & AA 确认</Text>
        </View>
      </View>

      <View className="activity-list">
        {activityList.map((activity) => (
          <ActivityCard
            activity={activity}
            key={activity.id}
            registration={registrationByActivityId[activity.id]}
            onClick={handleOpenActivity}
          />
        ))}
      </View>

      {hasMore ? (
        <Text className="load-more-button" onClick={() => setVisibleActivityCount(nextVisibleCount)}>
          加载更多小局
        </Text>
      ) : null}
    </View>
  );
}
