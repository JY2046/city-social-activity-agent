import { View, Text } from "@tarojs/components";

import "../discover/index.css";

export default function ProfilePage() {
  return (
    <View className="page page-light">
      <Text className="eyebrow">我的</Text>
      <Text className="title">活动经历可显示，也可隐藏</Text>
      <View className="activity-card">
        <Text className="activity-title">可信参与者</Text>
        <Text className="reason">对外展示等级与参加过几场活动，不展示原始分数。</Text>
      </View>
    </View>
  );
}
