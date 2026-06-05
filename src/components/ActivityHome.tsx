import { CalendarDays, Lock, MapPin, Sparkles, UserRoundCheck, Users } from "lucide-react";
import type { Activity } from "../domain/types";
import { activityVisuals, defaultActivityVisual } from "./activityVisuals";

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
    <>
      <section className="filter-strip" aria-label="活动类型">
        <span className="filter-chip active">推荐</span>
        <span className="filter-chip">饭局</span>
        <span className="filter-chip">咖啡</span>
        <span className="filter-chip">酒吧</span>
        <span className="filter-chip">免费活动</span>
      </section>

      <section className="content-grid" id="activity-feed" aria-label="活动列表">
        {activities.map((activity, index) => {
          const visual = activityVisuals[activity.id] ?? defaultActivityVisual;
          const isFeatured = index === 0;

          return (
            <article className={`activity-card tone-${visual.tone} ${isFeatured ? "featured" : ""}`} key={activity.id}>
              <div className="activity-image" style={{ backgroundImage: `url(${visual.imageUrl})` }}>
                <div className="image-shade" />
                <div className="card-topline">
                  <span>{typeLabels[activity.type]}</span>
                  <span>{activity.formationStatus === "formed" ? "已成局" : "报名中"}</span>
                </div>
              </div>
              <div className="activity-body">
                <div className="activity-title-row">
                  <h2>{activity.title}</h2>
                  <span className="headcount-pill">
                    {activity.currentParticipantCount}/{activity.capacity} 人
                  </span>
                </div>
                <p className="muted">
                  <MapPin size={16} /> {activity.area} · {activity.venue}
                </p>
                <p className="muted">
                  <CalendarDays size={16} />{" "}
                  {new Date(activity.startsAt).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="dot-divider" />
                  {activity.budgetType === "free" ? "免费" : `约 ${activity.estimatedCost} 元`}
                </p>
                <p className="ai-note">
                  <Sparkles size={16} /> {activity.aiRecommendationReason}
                </p>
                <button className="primary-button" type="button" onClick={() => onSelectActivity(activity.id)}>
                  查看 {activity.title}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="product-cues" aria-label="平台规则亮点">
        <div>
          <Lock size={18} />
          <strong>活动前不开放</strong>
          <span>联系方式</span>
        </div>
        <div>
          <Sparkles size={18} />
          <strong>活动后互选</strong>
          <span>双方同意才开放</span>
        </div>
        <div>
          <UserRoundCheck size={18} />
          <strong>局长协助</strong>
          <span>低压力任务卡</span>
        </div>
      </section>
    </>
  );
}
