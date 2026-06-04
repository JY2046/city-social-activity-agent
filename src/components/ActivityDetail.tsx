import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getParticipantPreview } from "../domain/rules";
import type { Activity, User } from "../domain/types";

interface ActivityDetailProps {
  activity: Activity;
  participants: User[];
  onBack: () => void;
  onSignup: () => void;
}

export function ActivityDetail({ activity, participants, onBack, onSignup }: ActivityDetailProps) {
  const previews = participants.map(getParticipantPreview);

  return (
    <section className="detail-layout">
      <button className="ghost-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> 返回活动
      </button>
      <div className="detail-main">
        <p className="eyebrow">
          {activity.area} · {activity.budgetType === "free" ? "免费活动" : `人均约 ${activity.estimatedCost} 元`}
        </p>
        <h1>{activity.title}</h1>
        <p className="hero-copy">{activity.aiRecommendationReason}</p>
      </div>
      <div className="detail-columns">
        <section className="info-panel">
          <h2>活动规则</h2>
          <p>{activity.aaRule}</p>
          <p>{activity.cancellationRule}</p>
          <p>{activity.privacyRule}</p>
          <button className="primary-button" type="button" onClick={onSignup}>
            报名并确认规则
          </button>
        </section>
        <section className="info-panel">
          <h2>
            <ShieldCheck size={20} /> 参与者预览
          </h2>
          <div className="participant-list">
            {previews.map((participant) => (
              <article className="participant-row" key={participant.nickname}>
                <div className="avatar">{participant.avatar}</div>
                <div>
                  <h3>{participant.nickname}</h3>
                  <p>{participant.bio}</p>
                  <p className="tag-line">
                    <span>{participant.reputationLevel}</span>
                    <span>{participant.attendedEventLabel}</span>
                  </p>
                  <p className="tag-line">
                    {participant.interests.map((interest) => (
                      <span key={interest}>{interest}</span>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
