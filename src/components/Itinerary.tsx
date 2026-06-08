import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  CreditCard,
  MessageSquareText,
  ReceiptText,
  Timer,
  MapPin,
  Users,
} from "lucide-react";
import { useState } from "react";
import { getSettlementSummary } from "../domain/rules";
import type { Activity, Settlement } from "../domain/types";

const formationStatusLabels: Record<Activity["formationStatus"], string> = {
  forming: "组局中",
  nearly_full: "即将满员",
  formed: "已成局",
  ongoing: "进行中",
  ended: "已结束",
  cancelled: "已取消",
};

interface ItineraryProps {
  activity: Activity;
  willingToBeJuZhang: boolean;
  juZhangQueued: boolean;
  paymentConfirmed: boolean;
  settlement: Settlement;
  onBackToDetail: () => void;
  onApplyJuZhang: () => void;
  onOpenJuZhang: () => void;
  onConfirmPayment: () => void;
  onFinishActivity: () => void;
}

export function Itinerary({
  activity,
  willingToBeJuZhang,
  juZhangQueued,
  paymentConfirmed,
  settlement,
  onBackToDetail,
  onApplyJuZhang,
  onOpenJuZhang,
  onConfirmPayment,
  onFinishActivity,
}: ItineraryProps) {
  const [arrivalStatus, setArrivalStatus] = useState<"onTime" | "late" | "unsure">("onTime");
  const [showSettlementDetail, setShowSettlementDetail] = useState(false);
  const settlementSummary = getSettlementSummary(settlement);

  return (
    <section className="flow-panel" id="itinerary">
      <button className="ghost-button" type="button" onClick={onBackToDetail}>
        <ArrowLeft size={18} /> 返回活动详情
      </button>
      <p className="eyebrow">报名成功</p>
      <h1>活动行程</h1>
      <div className="status-grid">
        <p>
          <Clock size={18} />{" "}
          {new Date(activity.startsAt).toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>
          <MapPin size={18} /> {activity.area} · {activity.venue}
        </p>
        <p>
          <Users size={18} /> {activity.currentParticipantCount}/{activity.capacity} 人 ·{" "}
          {formationStatusLabels[activity.formationStatus]}
        </p>
      </div>
      <p className="ai-note">AI 提醒：活动前 30 分钟确认到场；迟到可以在这里同步状态，不需要拉群。</p>
      <div className="arrival-sync" role="group" aria-label="同步到场状态">
        <div>
          <h2>
            <MessageSquareText size={18} /> 同步到场状态
          </h2>
          <p>活动开始前可更新状态，局长和系统会据此协调，不需要临时拉群。</p>
        </div>
        <div className="arrival-options">
          <button
            type="button"
            aria-pressed={arrivalStatus === "onTime"}
            onClick={() => setArrivalStatus("onTime")}
          >
            <CheckCircle2 size={16} /> 我会准时到
          </button>
          <button
            type="button"
            aria-pressed={arrivalStatus === "late"}
            onClick={() => setArrivalStatus("late")}
          >
            <Timer size={16} /> 可能迟到
          </button>
          <button
            type="button"
            aria-pressed={arrivalStatus === "unsure"}
            onClick={() => setArrivalStatus("unsure")}
          >
            <Clock size={16} /> 稍后确认
          </button>
        </div>
      </div>
      <section className="operation-card">
        <div>
          <h2>
            <Crown size={18} /> 局长协助
          </h2>
          <p>
            {willingToBeJuZhang
              ? "已勾选愿意担任局长，系统会在活动前 24 小时内选择。"
              : "你没有勾选局长，仍可正常参加活动。"}
          </p>
          {juZhangQueued && <p className="state-copy">局长候补排队中</p>}
        </div>
        {willingToBeJuZhang ? (
          <button className="primary-button" type="button" onClick={onOpenJuZhang}>
            查看局长任务
          </button>
        ) : (
          <button className="ghost-button" type="button" disabled={juZhangQueued} onClick={onApplyJuZhang}>
            {juZhangQueued ? "已进入候补" : "申请成为局长"}
          </button>
        )}
      </section>

      <section className="operation-card settlement-panel">
        <div>
          <h2>
            <ReceiptText size={18} /> {settlementSummary.isFree ? "费用状态" : "AA 结算确认"}
          </h2>
          <p>{settlementSummary.label}</p>
          {showSettlementDetail && !settlementSummary.isFree && (
            <p className="state-copy">系统按当前账单计算你的应付费用，支付后由局长核对状态。</p>
          )}
          {paymentConfirmed && <p className="state-copy">已提交支付确认，等待局长核对</p>}
        </div>
        {!settlementSummary.isFree && (
          <div className="settlement-actions">
            <button className="ghost-button" type="button" onClick={() => setShowSettlementDetail(true)}>
              <CreditCard size={17} /> 查看费用明细
            </button>
            <button className="primary-button" type="button" disabled={paymentConfirmed} onClick={onConfirmPayment}>
              <CheckCircle2 size={17} /> {paymentConfirmed ? "已确认支付" : "确认我已支付"}
            </button>
          </div>
        )}
      </section>

      <div className="button-row">
        <button className="ghost-button" type="button" onClick={onFinishActivity}>
          填写活动反馈
        </button>
      </div>
    </section>
  );
}
