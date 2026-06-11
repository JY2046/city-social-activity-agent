import { View, Text } from "@tarojs/components";
import { useState } from "react";
import { navigateTo } from "@tarojs/taro";

import {
  availableInterestOptions,
  getCurrentUserProfile,
  getProfileActivityHistory,
  getProfileViewModel,
  toggleInterestSelection,
} from "../../services/profileViewModel";

import "./index.css";

export default function ProfilePage() {
  const currentUserProfile = getCurrentUserProfile();
  const [showAttendedCount, setShowAttendedCount] = useState(() => currentUserProfile.showAttendedEventCount);
  const [selectedInterests, setSelectedInterests] = useState(() => currentUserProfile.interests);
  const profile = getProfileViewModel({
    ...currentUserProfile,
    interests: selectedInterests,
    showAttendedEventCount: showAttendedCount,
  });
  const activityHistory = getProfileActivityHistory();

  return (
    <View className="profile-page">
      <View className="profile-card">
        <View className="profile-top">
          <Text className="profile-avatar">{profile.avatar}</Text>
          <View className="profile-main">
            <Text className="profile-name">{profile.nickname}</Text>
            <Text className="profile-bio">{profile.bio}</Text>
          </View>
        </View>
        <View className="profile-stats">
          <View className="profile-stat">
            <Text className="stat-value">{profile.reputationWithCreditLabel}</Text>
            <Text className="stat-label">等级对外展示，信用分仅自己可见</Text>
          </View>
          <View className="profile-stat">
            <Text className="stat-value">{profile.attendedSummary}</Text>
            <Text className="stat-label">{profile.attendedVisibilityLabel}</Text>
          </View>
        </View>
      </View>

      <View className="profile-section">
        <View className="section-row">
          <Text className="profile-section-title">展示设置</Text>
          <Text className="toggle-pill" onClick={() => setShowAttendedCount((value) => !value)}>
            {showAttendedCount ? "隐藏场次" : "展示场次"}
          </Text>
        </View>
        <Text className="profile-copy">对外只显示等级和你选择公开的活动场次，不展示原始分数。</Text>
        <Text className="profile-copy">{profile.publicReputationCopy}</Text>
      </View>

      <View className="profile-section">
        <Text className="profile-section-title">小局身份</Text>
        <View className="badge-row">
          <Text className="profile-badge">{profile.juZhangEligibilityLabel}</Text>
          {profile.badges.map((badge) => (
            <Text className="profile-badge" key={badge}>
              {badge}
            </Text>
          ))}
        </View>
      </View>

      <View className="profile-section">
        <Text className="profile-section-title">最近想参加</Text>
        <View className="interest-row">
          {availableInterestOptions.map((interest) => (
            <Text
              className={profile.interests.includes(interest) ? "interest-chip active" : "interest-chip"}
              key={interest}
              onClick={() => setSelectedInterests((current) => toggleInterestSelection(current, interest))}
            >
              {interest}
            </Text>
          ))}
        </View>
      </View>

      <View className="profile-section">
        <Text className="profile-section-title">参与过的小局</Text>
        <View className="history-list">
          {activityHistory.map((item) => (
            <View className="history-card" key={item.activityId}>
              <View className="history-main" onClick={() => void navigateTo({ url: item.detailUrl })}>
                <Text className="history-title">{item.title}</Text>
                <Text className="history-meta">{item.meta}</Text>
                <Text className="history-status">{item.statusLabel}</Text>
              </View>
              <View className="history-actions">
                <Text className="history-action" onClick={() => void navigateTo({ url: item.detailUrl })}>
                  查看详情
                </Text>
                <Text className="history-action strong" onClick={() => void navigateTo({ url: item.feedbackUrl })}>
                  反馈与互选
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="profile-section safety-section">
        <Text className="profile-section-title">平台规则</Text>
        <Text className="profile-copy">普通参与者活动前 12 小时内退出会影响等级；局长接受后 24 小时内退出会触发替换。</Text>
        <Text className="profile-copy">活动前不开放联系方式，活动后双方互选才开放联系。</Text>
      </View>
    </View>
  );
}
