import {
  CalendarDays,
  ChevronRight,
  Lock,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { Fragment } from "react";
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
  const displayActivities = [
    activities[0],
    ...activities.slice(1).sort((left, right) => {
      const order = { coffee: 1, walk: 2, bar: 3, dinner: 4 };
      return order[left.type] - order[right.type];
    }),
  ].filter(Boolean);

  const renderProductCues = () => (
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
        <span>协同流程 & AA 确认</span>
      </div>
    </section>
  );

  return (
    <>
      <section className="search-panel" aria-label="活动搜索">
        <label className="search-box">
          <Search size={18} />
          <input placeholder="搜索活动、地点" aria-label="搜索活动、地点" />
        </label>
        <button className="filter-button" type="button">
          <SlidersHorizontal size={18} /> 筛选
        </button>
      </section>

      <section className="filter-strip" aria-label="活动类型">
        <span className="filter-chip active">推荐</span>
        <span className="filter-chip">饭局</span>
        <span className="filter-chip">咖啡</span>
        <span className="filter-chip">酒吧</span>
        <span className="filter-chip">免费活动</span>
        <span className="filter-chip">全部</span>
      </section>

      <section className="content-grid" id="activity-feed" aria-label="活动列表">
        {displayActivities.map((activity, index) => {
          const visual = activityVisuals[activity.id] ?? defaultActivityVisual;
          const isFeatured = index === 0;
          const shouldShowAiNote = isFeatured || activity.type !== "walk";
          const startsAtText = new Date(activity.startsAt).toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const costText = activity.budgetType === "free" ? "免费" : `约 ${activity.estimatedCost} 元`;

          return (
            <Fragment key={activity.id}>
              <article className={`activity-card tone-${visual.tone} ${isFeatured ? "featured" : ""}`}>
                <div className="activity-image" style={{ backgroundImage: `url(${visual.imageUrl})` }}>
                  <div className="image-shade" />
                  <div className="card-topline">
                    <span>{activity.formationStatus === "formed" ? "已成局" : "报名中"}</span>
                    <span>{activity.currentParticipantCount}/{activity.capacity} 人</span>
                  </div>
                  {isFeatured && (
                    <div className="featured-overlay">
                      <span className="type-mark">{typeLabels[activity.type]}</span>
                      <h2>{activity.title}</h2>
                      <p className="muted">
                        <MapPin size={16} /> {activity.area} · {activity.venue}
                      </p>
                      <p className="muted">
                        <CalendarDays size={16} /> {startsAtText}
                        <span className="dot-divider" />
                        {costText}
                      </p>
                      <button
                        className="primary-button"
                        type="button"
                        aria-label={`查看 ${activity.title}`}
                        onClick={() => onSelectActivity(activity.id)}
                      >
                        <span>查看活动</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="activity-body">
                  {!isFeatured && (
                    <>
                      <div className="activity-title-row">
                        <span className="type-mark">{typeLabels[activity.type]}</span>
                        <span className="headcount-pill">
                          {activity.currentParticipantCount}/{activity.capacity} 人
                        </span>
                      </div>
                      <h2>{activity.title}</h2>
                      <p className="muted">
                        <MapPin size={16} /> {activity.area} · {activity.venue}
                      </p>
                      <p className="muted">
                        <CalendarDays size={16} /> {startsAtText}
                        <span className="dot-divider" />
                        {costText}
                      </p>
                    </>
                  )}
                  {shouldShowAiNote && (
                    <p className="ai-note">
                      <Sparkles size={16} />
                      <span>
                        <strong>AI 推荐</strong>
                        {activity.aiRecommendationReason}
                      </span>
                    </p>
                  )}
                  {!isFeatured && (
                    <button
                      className="primary-button"
                      type="button"
                      aria-label={`查看 ${activity.title}`}
                      onClick={() => onSelectActivity(activity.id)}
                    >
                      <span>查看 {activity.title}</span>
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </article>
              {index === 2 && renderProductCues()}
            </Fragment>
          );
        })}
      </section>
    </>
  );
}
