import { Button, Switch, Text, View } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tarojs/taro";
import type { Registration } from "@city-social/domain";

import { getActivity } from "../../services/activityService";
import {
  createActivityReadAdapter,
  loadActivityDetail,
} from "../../services/activityReadService";
import { getSignupViewState } from "../../services/flowViewModels";
import { createRegistrationWriteAdapter, runSignup } from "../../services/registrationWriteService";
import type { MiniProgramActivity } from "../../services/mockData";

import "./index.css";

export default function SignupPage() {
  const router = useRouter();
  const activityId = typeof router.params.activityId === "string" ? router.params.activityId : "a-sushi";
  const activityReadAdapter = useMemo(() => createActivityReadAdapter(), []);
  const [activity, setActivity] = useState<MiniProgramActivity | undefined>(() => getActivity(activityId));
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [willingToBeJuZhang, setWillingToBeJuZhang] = useState(false);
  const [registration, setRegistration] = useState<Registration | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const viewState = getSignupViewState(registration);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      const result = await loadActivityDetail(activityId, activityReadAdapter);

      if (!isMounted) {
        return;
      }

      if (result.status === "ready") {
        setActivity(result.activity);
        setSubmitMessage("");
        return;
      }

      if (result.status === "empty") {
        setActivity(undefined);
        setSubmitMessage("活动不存在或暂不可报名");
        return;
      }

      if (result.status === "error") {
        setSubmitMessage(result.message);
      }
    }

    void loadActivity();

    return () => {
      isMounted = false;
    };
  }, [activityId, activityReadAdapter]);

  async function handleSignup() {
    if (!rulesAccepted || !activity) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    const result = await runSignup(createRegistrationWriteAdapter(), activity.id, { willingToBeJuZhang });
    setIsSubmitting(false);

    if (result.status === "ready") {
      setRegistration(result.registration);
      return;
    }

    setSubmitMessage(result.message);
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">确认报名</Text>
      <Text className="flow-title">{activity?.title ?? "活动不存在"}</Text>

      <View className="flow-card">
        <Text className="card-title">报名前确认</Text>
        <Text className="card-copy">活动前不开放联系方式，活动后双方互选才开放联系。</Text>
        <Text className="card-copy">普通参与者活动前 12 小时内退出会影响内部记录。</Text>
        <View className="switch-row">
          <Text className="switch-label">我已了解活动规则</Text>
          <Switch checked={rulesAccepted} onChange={(event) => setRulesAccepted(event.detail.value)} color="#24452f" />
        </View>
      </View>

      <View className="flow-card">
        <Text className="card-title">是否愿意担任局长</Text>
        <Text className="card-copy">勾选后才进入局长候选；未勾选只完成普通报名，不显示局长任务。</Text>
        <View className="switch-row">
          <Text className="switch-label">愿意担任局长</Text>
          <Switch
            checked={willingToBeJuZhang}
            onChange={(event) => setWillingToBeJuZhang(event.detail.value)}
            color="#24452f"
          />
        </View>
      </View>

      <Button className="primary-button" disabled={!rulesAccepted || !activity || isSubmitting} onClick={handleSignup}>
        {isSubmitting ? "提交中" : "确认报名"}
      </Button>
      {submitMessage ? <Text className="flow-message">{submitMessage}</Text> : null}

      <View className="result-card">
        <Text className="result-title">{viewState.title}</Text>
        <Text className="card-copy">{viewState.message}</Text>
        {viewState.showJuZhangTaskEntry ? <Text className="task-entry">查看局长任务</Text> : null}
      </View>
    </View>
  );
}
