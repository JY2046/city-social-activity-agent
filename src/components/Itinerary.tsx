import { Clock, MapPin, Users } from "lucide-react";
import type { Activity } from "../domain/types";

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
  return (
    <section className="flow-panel">
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
          <Users size={18} /> {activity.currentParticipantCount}/{activity.capacity} 人 · 已成局
        </p>
      </div>
      <p className="ai-note">AI 提醒：活动前 30 分钟确认到场；迟到可以在这里同步状态，不需要拉群。</p>
      <p>
        {willingToBeJuZhang
          ? "已勾选愿意担任局长，系统会在活动前 24 小时内选择。"
          : "你没有勾选局长，仍可正常参加活动。"}
      </p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={onOpenJuZhang}>
          查看局长任务
        </button>
        <button className="ghost-button" type="button" onClick={onFinishActivity}>
          模拟活动结束
        </button>
      </div>
    </section>
  );
}
