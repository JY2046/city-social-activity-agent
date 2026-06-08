import { CheckCircle2, Clock, MessageSquareText, Timer, MapPin, Users } from "lucide-react";
import { useState } from "react";
import type { Activity } from "../domain/types";

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
  onOpenJuZhang: () => void;
  onFinishActivity: () => void;
}

export function Itinerary({
  activity,
  willingToBeJuZhang,
  onOpenJuZhang,
  onFinishActivity,
}: ItineraryProps) {
  const [arrivalStatus, setArrivalStatus] = useState<"onTime" | "late" | "unsure">("onTime");

  return (
    <section className="flow-panel" id="itinerary">
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
      <p>
        {willingToBeJuZhang
          ? "已勾选愿意担任局长，系统会在活动前 24 小时内选择。"
          : "你没有勾选局长，仍可正常参加活动。"}
      </p>
      <div className="button-row">
        {willingToBeJuZhang && (
          <button className="primary-button" type="button" onClick={onOpenJuZhang}>
            查看局长任务
          </button>
        )}
        <button className="ghost-button" type="button" onClick={onFinishActivity}>
          模拟活动结束
        </button>
      </div>
    </section>
  );
}
