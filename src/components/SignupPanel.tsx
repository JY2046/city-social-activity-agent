import type { Activity } from "../domain/types";

interface SignupPanelProps {
  activity: Activity;
  willingToBeJuZhang: boolean;
  onToggleJuZhang: (value: boolean) => void;
  onBack: () => void;
  onConfirmSignup: () => void;
}

export function SignupPanel({
  activity,
  willingToBeJuZhang,
  onToggleJuZhang,
  onBack,
  onConfirmSignup,
}: SignupPanelProps) {
  return (
    <section className="flow-panel">
      <button className="ghost-button" type="button" onClick={onBack}>
        返回详情
      </button>
      <p className="eyebrow">报名确认</p>
      <h1>{activity.title}</h1>
      <div className="rule-list">
        <p>{activity.budgetType === "free" ? "本活动费用为 0，不需要 AA 结算。" : activity.aaRule}</p>
        <p>{activity.cancellationRule}</p>
        <p>{activity.privacyRule}</p>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={willingToBeJuZhang}
          onChange={(event) => onToggleJuZhang(event.target.checked)}
        />
        我愿意担任局长
      </label>
      <p className="muted">局长可以拒绝，拒绝不影响继续参加活动；接受后会收到 AI 任务卡。</p>
      <button className="primary-button" type="button" onClick={onConfirmSignup}>
        确认报名
      </button>
    </section>
  );
}
