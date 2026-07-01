import { HeartHandshake, ShieldAlert } from "lucide-react";
import type { User } from "../domain/types";

interface FeedbackPanelProps {
  participants: User[];
  onBackToHome: () => void;
}

export function FeedbackPanel({ participants, onBackToHome }: FeedbackPanelProps) {
  return (
    <section className="flow-panel">
      <p className="eyebrow">活动后</p>
      <h1>活动反馈与互选</h1>
      <div className="feedback-grid">
        <article className="task-card">
          <HeartHandshake size={20} />
          <div>
            <h2>互选联系</h2>
            <p>双方都选择后才开放联系方式。</p>
            <div className="participant-list compact">
              {participants.map((participant) => (
                <label className="check-row compact" key={participant.id}>
                  <input type="checkbox" />
                  愿意和 {participant.nickname} 互相开放联系
                </label>
              ))}
            </div>
          </div>
        </article>
        <article className="task-card">
          <ShieldAlert size={20} />
          <div>
            <h2>异常反馈</h2>
            <p>可以反馈爽约、推销、骚扰、虚假信息或其他让你不舒服的行为。</p>
            <textarea className="feedback-input" aria-label="异常反馈" />
          </div>
        </article>
      </div>
      <button className="primary-button" type="button" onClick={onBackToHome}>
        完成反馈
      </button>
    </section>
  );
}
