import { View, Text } from "@tarojs/components";

import "../discover/index.css";

export default function ItineraryPage() {
  return (
    <View className="page page-light">
      <Text className="eyebrow">我的行程</Text>
      <Text className="title">到场、结算、反馈都在这里</Text>
      <View className="activity-card">
        <Text className="activity-title">周五下班日料小局</Text>
        <Text className="reason">活动前同步到场状态；活动后普通参与者确认费用和完成支付。</Text>
      </View>
    </View>
  );
}
