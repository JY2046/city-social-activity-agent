import { View, Text } from "@tarojs/components";

import "../discover/index.css";

export default function SignupPage() {
  return (
    <View className="page page-light">
      <Text className="eyebrow">确认报名</Text>
      <Text className="title">先确认边界，再加入小局</Text>
      <View className="activity-card">
        <Text className="activity-title">可选择是否愿意担任局长</Text>
        <Text className="reason">未勾选时只完成普通报名；勾选后才进入局长候选与任务流程。</Text>
      </View>
    </View>
  );
}
