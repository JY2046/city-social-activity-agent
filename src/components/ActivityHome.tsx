import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import type { Activity } from "../domain/types";

interface ActivityHomeProps {
  activities: Activity[];
  onSelectActivity: (activityId: string) => void;
}

const typeLabels: Record<Activity["type"], string> = {
  dinner: "饭局",
  coffee: "咖啡",
  bar: "小酒馆",
  walk: "免费散步",
};

export function ActivityHome({ activities, onSelectActivity }: ActivityHomeProps) {
  return (
    <section className="content-grid" aria-label="活动列表">
      {activities.map((activity) => (
        <article className="activity-card" key={activity.id}>
          <div className="card-topline">
            <span>{typeLabels[activity.type]}</span>
            <span>{activity.budgetType === "free" ? "免费" : `约 ${activity.estimatedCost} 元`}</span>
          </div>
          <h2>{activity.title}</h2>
          <p className="muted">
            <CalendarDays size={16} />{" "}
            {new Date(activity.startsAt).toLocaleString("zh-CN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="muted">
            <MapPin size={16} /> {activity.area} · {activity.venue}
          </p>
          <p className="muted">
            <Users size={16} /> {activity.currentParticipantCount}/{activity.capacity} 人 ·{" "}
            {activity.formationStatus === "formed" ? "已成局" : "报名中"}
          </p>
          <p className="ai-note">
            <Sparkles size={16} /> {activity.aiRecommendationReason}
          </p>
          <button className="primary-button" type="button" onClick={() => onSelectActivity(activity.id)}>
            查看 {activity.title}
          </button>
        </article>
      ))}
    </section>
  );
}
