import { CheckCircle2, MessageCircle, ReceiptText, UserRoundCheck } from "lucide-react";
import { getSettlementSummary } from "../domain/rules";
import type { Activity, Settlement, TopicCard } from "../domain/types";

interface JuZhangPanelProps {
  activity: Activity;
  topicCard: TopicCard;
  settlement: Settlement;
  accepted: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onFinish: () => void;
}

export function JuZhangPanel({
  activity,
  topicCard,
  settlement,
  accepted,
  onAccept,
  onDecline,
  onFinish,
}: JuZhangPanelProps) {
  const settlementSummary = getSettlementSummary(settlement);

  return (
    <section className="flow-panel">
      <p className="eyebrow">局长任务</p>
      <h1>局长不是组织者，只是本局的小帮手</h1>
      {!accepted && (
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onAccept}>
            接受局长
          </button>
          <button className="ghost-button" type="button" onClick={onDecline}>
            拒绝，不影响参加
          </button>
        </div>
      )}
      {accepted && (
        <div className="task-list">
          <article className="task-card">
            <UserRoundCheck size={20} />
            <div>
              <h2>到场确认</h2>
              <p>到达后点一下已到，帮助大家知道本局有人在现场。</p>
            </div>
          </article>
          <article className="task-card">
            <MessageCircle size={20} />
            <div>
              <h2>AI 话题卡</h2>
              <p>{topicCard.visibleText}</p>
            </div>
          </article>
          <article className="task-card">
            <ReceiptText size={20} />
            <div>
              <h2>{activity.requiresSettlement ? "AA 结算" : "费用确认"}</h2>
              <p>{settlementSummary.label}</p>
              <p>
                {settlementSummary.isFree
                  ? "本活动无需确认支付状态。"
                  : `还有 ${settlementSummary.unpaidCount} 人未确认支付。`}
              </p>
            </div>
          </article>
          <button className="primary-button" type="button" onClick={onFinish}>
            <CheckCircle2 size={18} /> 完成局长任务
          </button>
        </div>
      )}
    </section>
  );
}
