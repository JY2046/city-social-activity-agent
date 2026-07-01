import { ArrowLeft, CalendarDays, Images, MapPin, ShieldCheck, Sparkles, Tag, Utensils } from "lucide-react";
import { getParticipantPreview } from "../domain/rules";
import type { Activity, User } from "../domain/types";

interface ActivityDetailProps {
  activity: Activity;
  participants: User[];
  onBack: () => void;
  onSignup: () => void;
  onJoinWaitlist: () => void;
}

export function ActivityDetail({ activity, participants, onBack, onSignup, onJoinWaitlist }: ActivityDetailProps) {
  const isFull = activity.currentParticipantCount >= activity.capacity;
  const assetBase = import.meta.env.BASE_URL;
  const startsAtText = new Date(activity.startsAt).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const spendText = activity.budgetType === "free" ? "免费" : `预计人均 ${activity.estimatedCost} 元`;

  return (
    <section className="detail-layout">
      <button className="ghost-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> 返回活动首页
      </button>
      <div className="detail-main">
        <p className="eyebrow">{activity.area} · {activity.venue}</p>
        <p className="detail-meta">
          {activity.budgetType === "free" ? "免费活动" : `人均约 ${activity.estimatedCost} 元`}
        </p>
        <h1>{activity.title}</h1>
        <p className="hero-copy">{activity.aiRecommendationReason}</p>
      </div>
      <p className="detail-section-kicker">
        <Images size={17} /> 活动公开照片
      </p>
      <div className="detail-gallery" aria-label="活动公开照片">
        {activity.gallery.map((item) => (
          <figure key={`${activity.id}-${item.imagePath}-${item.sourceLabel}`}>
            <img src={`${assetBase}${item.imagePath}`} alt={item.alt} />
            <figcaption>{item.sourceLabel}</figcaption>
          </figure>
        ))}
      </div>
      <section className="detail-facts" aria-label="活动关键信息">
        <p>
          <CalendarDays size={17} /> {startsAtText}
        </p>
        <p>
          <MapPin size={17} /> {activity.area} · {activity.venue}
        </p>
        <p>
          <Tag size={17} /> {spendText}
        </p>
      </section>
      <div className="detail-columns">
        <section className="info-panel attraction-panel">
          <h2>
            <Sparkles size={20} /> 种草理由
          </h2>
          <p>{activity.attractionSummary}</p>
          <div className="proof-strip">
            {activity.venueProofs.map((proof) => (
              <span key={proof}>{proof}</span>
            ))}
          </div>
        </section>

        <section className="info-panel">
          <h2>
            <Utensils size={20} /> 菜品与体验亮点
          </h2>
          <div className="experience-grid">
            {activity.experienceHighlights.map((highlight) => (
              <article key={highlight.title}>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="info-panel location-panel">
          <h2>
            <MapPin size={20} /> 位置与消费
          </h2>
          <div className="location-grid">
            <p>
              <strong>地点</strong>
              {activity.area} · {activity.venue}
            </p>
            <p>
              <strong>消费</strong>
              {activity.budgetType === "free" ? "免费" : `人均约 ${activity.estimatedCost} 元`}
            </p>
          </div>
          <p>{activity.locationGuide}</p>
        </section>

        <section className="info-panel participant-preview-panel">
          <h2>
            <ShieldCheck size={20} /> 参与者预览
          </h2>
          <div className="participant-list compact-preview">
            {participants.map((user) => {
              const preview = getParticipantPreview(user);

              return (
                <article className="participant-row" key={user.id}>
                  <div className="avatar">{preview.avatar}</div>
                  <div>
                    <h3>{preview.nickname}</h3>
                    <p>{preview.bio}</p>
                    <p className="tag-line">
                      <span>{preview.reputationLevel}</span>
                      {preview.interests.slice(0, 2).map((interest) => (
                        <span key={interest}>{interest}</span>
                      ))}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="info-panel">
          <h2>活动规则</h2>
          <p>{activity.aaRule}</p>
          <p>{activity.cancellationRule}</p>
          <p>{activity.privacyRule}</p>
          <button className="primary-button" type="button" onClick={isFull ? onJoinWaitlist : onSignup}>
            {isFull ? "加入候补排队" : "报名并确认规则"}
          </button>
        </section>
      </div>
    </section>
  );
}
