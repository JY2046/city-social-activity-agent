import { Image, View, Text } from "@tarojs/components";
import { navigateTo } from "@tarojs/taro";
import { useEffect, useState } from "react";
import type { ActivityType, BudgetType } from "@city-social/domain";

import ActivityCard from "../../components/ActivityCard";
import { loadActivityFeed, type ActivityFeedLoadState } from "../../services/activityReadService";
import type { MiniProgramActivity } from "../../services/mockData";

import "./index.css";

const initialFeedState: ActivityFeedLoadState = {
  status: "loading",
  activities: [],
};

type CategoryKey = "recommended" | ActivityType | "free";

interface CategoryOption {
  key: CategoryKey;
  label: string;
  type?: ActivityType;
  budgetType?: BudgetType;
}

const cityOptions = ["上海", "北京", "杭州", "成都"];
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("recommended");
  const activities = feedState.activities;
  const [featuredActivity, ...activityList] = activities;

  useEffect(() => {
    let isMounted = true;
    const category = categoryOptions.find((option) => option.key === selectedCategory);

    setFeedState(initialFeedState);

    void loadActivityFeed(undefined, {
      city: selectedCity,
      type: category?.type,
      budgetType: category?.budgetType,
    }).then((nextState) => {
      if (isMounted) {
        setFeedState(nextState);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedCity]);

  function handleOpenActivity(activity: MiniProgramActivity) {
    void navigateTo({ url: `/pages/activity-detail/index?activityId=${activity.id}` });
  }

  return (
    <View className="page page-light">
      <View className="home-hero">
        <Image className="hero-skyline" src="/assets/images/city-skyline.jpg" mode="aspectFill" />
        <View className="hero-content">
          <Text className="eyebrow">{selectedCity} · 6月5日 周四 18:40</Text>
          <Text className="app-name">City Social Activity Agent</Text>
          <Text className="title">
            先活动，<Text className="title-accent">后关系</Text>
          </Text>
          <Text className="subtitle">在真实的城市里，认识有趣的人</Text>
        </View>
      </View>

      <View className="city-row">
        <Text className="locate-pill" onClick={() => setSelectedCity("上海")}>
          定位上海
        </Text>
        {cityOptions.map((city) => (
          <Text
            className={selectedCity === city ? "city-pill active" : "city-pill"}
            key={city}
            onClick={() => setSelectedCity(city)}
          >
            {city}
          </Text>
        ))}
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
            onClick={() => setSelectedCategory(category.key)}
          >
            {category.label}
          </Text>
        ))}
      </View>

      {feedState.status === "loading" ? <Text className="feed-state">正在打开今天的小局...</Text> : null}
      {feedState.status === "error" ? <Text className="feed-state">活动加载失败：{feedState.message}</Text> : null}
      {feedState.status === "empty" ? <Text className="feed-state">今天的小局还在准备中</Text> : null}

      {featuredActivity ? <ActivityCard activity={featuredActivity} featured onClick={handleOpenActivity} /> : null}

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
          <ActivityCard activity={activity} key={activity.id} onClick={handleOpenActivity} />
        ))}
      </View>
    </View>
  );
}
