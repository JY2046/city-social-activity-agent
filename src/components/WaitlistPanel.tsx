import { ArrowLeft, Bell, CalendarDays, Clock, UsersRound } from "lucide-react";
import type { Activity } from "../domain/types";

interface WaitlistPanelProps {
  activity: Activity;
  type: "activity" | "juZhang";
  onBackToDetail: () => void;
  onBackToItinerary: () => void;
}

export function WaitlistPanel({ activity, type, onBackToDetail, onBackToItinerary }: WaitlistPanelProps) {
  const isJuZhangQueue = type === "juZhang";
  const startsAtText = new Date(activity.startsAt).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="flow-panel waitlist-panel">
      <button className="ghost-button" type="button" onClick={isJuZhangQueue ? onBackToItinerary : onBackToDetail}>
        <ArrowLeft size={18} /> {isJuZhangQueue ? "返回活动行程" : "返回活动详情"}
      </button>
      <p className="eyebrow">{isJuZhangQueue ? "局长候补" : "名额候补"}</p>
      <h1>{isJuZhangQueue ? "局长候补排队中" : "候补排队中"}</h1>
      <p className="waitlist-copy">
        {isJuZhangQueue
          ? "如果当前局长退出或需要协助，系统会按候补顺序通知你。"
          : "如果有名额释放，系统会按候补顺序通知你。"}
      </p>
      <div className="status-grid">
        <p>
          <CalendarDays size={18} /> {startsAtText}
        </p>
        <p>
          <UsersRound size={18} /> {activity.currentParticipantCount}/{activity.capacity} 人 ·{" "}
          {activity.currentParticipantCount >= activity.capacity ? "已满员" : "仍可报名"}
        </p>
        <p>
          <Clock size={18} /> 活动前会保留你的候补状态
        </p>
      </div>
      <div className="waitlist-tip">
        <Bell size={20} />
        <p>系统会通过活动行程同步排队变化，不需要加入大群等待。</p>
      </div>
      <button className="primary-button" type="button" onClick={isJuZhangQueue ? onBackToItinerary : onBackToDetail}>
        {isJuZhangQueue ? "返回活动行程" : "返回活动详情"}
      </button>
    </section>
  );
}
