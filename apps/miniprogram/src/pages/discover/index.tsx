import { View, Text } from "@tarojs/components";
import ActivityCard from "../../components/ActivityCard";
import { listActivities } from "../../services/activityService";

import "./index.css";

export default function DiscoverPage() {
  const activities = listActivities();
  const [featuredActivity, ...activityList] = activities;

  return (
    <View className="page page-light">
      <View className="home-hero">
        <Text className="eyebrow">上海 · 6月5日 周四 18:40</Text>
        <Text className="app-name">City Social Activity Agent</Text>
        <Text className="title">
          先活动，<Text className="title-accent">后关系</Text>
        </Text>
        <Text className="subtitle">在真实的城市里，认识有趣的人</Text>
      </View>

      <View className="search-row">
        <Text className="search-box">搜索活动、地点</Text>
        <Text className="filter-button">筛选</Text>
      </View>

      <View className="category-row">
        <Text className="category-active">推荐</Text>
        <Text className="category">饭局</Text>
        <Text className="category">咖啡</Text>
        <Text className="category">酒吧</Text>
        <Text className="category">免费活动</Text>
      </View>

      {featuredActivity ? <ActivityCard activity={featuredActivity} featured /> : null}

      <View className="activity-list">
        {activityList.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} />
        ))}
      </View>

      <View className="trust-strip">
        <View className="trust-item">
          <Text className="trust-title">活动前不开放</Text>
          <Text className="trust-copy">联系方式</Text>
        </View>
        <View className="trust-item">
          <Text className="trust-title">活动后互选</Text>
          <Text className="trust-copy">双向同意才开放联系</Text>
        </View>
        <View className="trust-item">
          <Text className="trust-title">局长</Text>
          <Text className="trust-copy">协助流程 & AA 确认</Text>
        </View>
      </View>
    </View>
  );
}
