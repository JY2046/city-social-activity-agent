import {
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  ReceiptText,
  Share2,
  Tag,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { getSettlementSummary } from "../domain/rules";
import type { Activity, Settlement, TopicCard } from "../domain/types";
import { activityVisuals, defaultActivityVisual } from "./activityVisuals";

interface JuZhangPanelProps {
  activity: Activity;
  topicCard: TopicCard;
  settlement: Settlement;
  accepted: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onFinish: () => void;
}

export function JuZhangPanel({
  activity,
  topicCard,
  settlement,
  accepted,
  onAccept,
  onDecline,
  onFinish,
}: JuZhangPanelProps) {
  const settlementSummary = getSettlementSummary(settlement);
  const visual = activityVisuals[activity.id] ?? defaultActivityVisual;
  const venueImageUrl = `${import.meta.env.BASE_URL}images/venue-night.jpg`;
  const startsAtText = new Date(activity.startsAt).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="flow-panel ju-zhang-flow" id="ju-zhang">
      <div className="ju-hero" style={{ backgroundImage: `url(${venueImageUrl}), url(${visual.imageUrl})` }}>
        <div className="ju-hero-actions">
          <button type="button" aria-label="返回">
            <ChevronRight size={24} />
          </button>
          <span>
            <button type="button" aria-label="分享">
              <Share2 size={18} />
            </button>
            <button type="button" aria-label="更多">
              <MoreHorizontal size={20} />
            </button>
          </span>
        </div>
        <div className="ju-hero-copy">
          <span className="ju-type-pill">饭局</span>
          <h1>{activity.title}</h1>
          <p>
            <MapPin size={17} /> {activity.area} · {activity.venue}
          </p>
          <p>
            <CalendarDays size={17} /> {startsAtText}
          </p>
          <p>
            <UsersRound size={17} /> {activity.currentParticipantCount}/{activity.capacity} 人 ·{" "}
            {activity.formationStatus === "formed" ? "已成局" : "报名中"}
          </p>
          <p>
            <Tag size={17} /> {settlementSummary.isFree ? "免费" : `人均约 ${activity.estimatedCost} 元`}
          </p>
        </div>
      </div>

      <div className="ju-ai-reminder">
        <Bell size={18} />
        <p>
          <strong>AI 提醒：</strong>活动前 30 分钟确认到场，迟到可以在这里同步状态，不需要拉群。
        </p>
      </div>

      {!accepted && (
        <div className="ju-accept-card">
          <Crown size={34} />
          <div>
            <h2>是否愿意担任局长？</h2>
            <p>系统会给你低压力任务指引，拒绝不影响继续参加。</p>
          </div>
        </div>
      )}

      {!accepted && (
        <div className="button-row ju-action-row">
          <button className="primary-button" type="button" onClick={onAccept}>
            接受局长
          </button>
          <button className="ghost-button" type="button" onClick={onDecline}>
            拒绝，不影响参加
          </button>
        </div>
      )}
      {accepted && (
        <>
          <div className="ju-accepted-card">
            <CheckCircle2 size={32} />
            <div>
              <h2>已勾选愿意担任局长</h2>
              <p>系统会在活动前 24 小时内选择。</p>
            </div>
            <Crown size={44} />
          </div>

          <div className="ju-section-card ju-task-overview">
            <div className="ju-section-title">
              <h2>
                <Crown size={20} /> 局长任务
              </h2>
              <small>系统会提供指引</small>
              <span className="ju-title-action">查看全部 <ChevronRight size={15} /></span>
            </div>
            <div className="ju-task-grid">
              <article>
                <UsersRound size={22} />
                <strong>开场 & 破冰</strong>
                <p>借助 AI 话题卡自然开启对话</p>
              </article>
              <article>
                <ClipboardCheck size={22} />
                <strong>活动中协调</strong>
                <p>关注大家体验，必要时协助沟通</p>
              </article>
              <article>
                <ReceiptText size={22} />
                <strong>AA 结算确认</strong>
                <p>活动后确认 AA 状态，完成结算</p>
              </article>
            </div>
          </div>

          <section className="ju-section-card ju-arrival-card">
            <div className="ju-section-title">
              <h2>
                <ClipboardCheck size={20} /> 到场核准
              </h2>
              <small>活动前 30 分钟</small>
            </div>
            <div className="ju-arrival-grid">
              <span>
                <strong>{Math.max(activity.currentParticipantCount - 1, 0)}</strong>
                已确认到场
              </span>
              <span>
                <strong>1</strong>
                可能迟到
              </span>
              <span>
                <strong>{activity.capacity - activity.currentParticipantCount}</strong>
                可候补名额
              </span>
            </div>
            <p className="settlement-helper">根据到场同步状态，必要时提醒候补用户或协助迟到成员更新信息。</p>
          </section>

          <section className="ju-section-card ju-coordination-card">
            <div className="ju-section-title">
              <h2>
                <MessageCircle size={20} /> 活动中协调
              </h2>
              <small>AI 会给低压力指引</small>
            </div>
            <div className="ju-check-list">
              <span>
                <CheckCircle2 size={17} /> 开场时使用 AI 话题卡
              </span>
              <span>
                <CheckCircle2 size={17} /> 观察是否有人落单
              </span>
              <span>
                <CheckCircle2 size={17} /> 结账前提醒 AA 方式
              </span>
            </div>
          </section>

          <article className="ju-topic-card">
            <div className="ju-section-title">
              <h2>
                <MessageCircle size={20} /> AI 话题卡
              </h2>
              <small>为你们精选</small>
              <span className="ju-title-action">换一张 <RefreshCw size={14} /></span>
            </div>
            <div className="topic-visual-card">
              <Bot size={42} />
              <p>{topicCard.visibleText}</p>
              <small>这是一个开放式话题，分享体验或理由都很棒</small>
              <div className="topic-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>

          <article className="ju-settlement-card">
            <div className="ju-section-title">
              <h2>
                <ReceiptText size={20} /> {activity.requiresSettlement ? "AA 结算" : "费用确认"}
              </h2>
              <span>{settlementSummary.label}</span>
            </div>
            <div className="settlement-steps">
              <span>
                <UsersRound size={20} />
                等待局长发起 AA 结算
              </span>
              <ChevronRight size={18} />
              <span>
                <ReceiptText size={20} />
                局长录入实际金额
              </span>
              <ChevronRight size={18} />
              <span>
                <CheckCircle2 size={20} />
                确认每人金额完成支付
              </span>
              <ChevronRight size={18} />
              <span>
                <CheckCircle2 size={20} />
                局长确认大家支付状态
              </span>
            </div>
            <p className="settlement-helper">
              {settlementSummary.isFree ? "本活动无需确认支付状态。" : `还有 ${settlementSummary.unpaidCount} 人未确认支付。`}
            </p>
            {!settlementSummary.isFree && (
              <div className="ju-payment-list">
                <span>
                  <CheckCircle2 size={17} /> 林夏 已支付
                </span>
                <span>
                  <CheckCircle2 size={17} /> 陈予 已支付
                </span>
                <span className="pending">
                  <ReceiptText size={17} /> Momo 待核对
                </span>
              </div>
            )}
          </article>

          <article className="ju-mutual-card">
            <Heart size={24} />
            <div>
              <h2>活动后互选</h2>
              <p>活动结束后可互选，双方同意才会开放联系。</p>
            </div>
            <span>活动结束后开启</span>
          </article>

          <article className="ju-feedback-card">
            <Heart size={24} />
            <div>
              <h2>活动后反馈</h2>
              <p>记录现场体验、异常情况和是否推荐继续开放同类活动。</p>
            </div>
            <button className="ghost-button" type="button" onClick={onFinish}>
              填写局长反馈
            </button>
          </article>

          <div className="ju-bottom-actions">
            <button className="ghost-button" type="button">
              <CalendarDays size={18} /> 添加到日历
            </button>
            <button className="primary-button" type="button" aria-label="完成局长任务" onClick={onFinish}>
              <UserPlus size={18} /> 活动后反馈
            </button>
          </div>
        </>
      )}
    </section>
  );
}
