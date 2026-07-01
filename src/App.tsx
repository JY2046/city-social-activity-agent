import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { CalendarCheck2, ChevronDown, Compass, Crown, MapPin, UserRound } from "lucide-react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { Itinerary } from "./components/Itinerary";
import { JuZhangPanel } from "./components/JuZhangPanel";
import { SignupPanel } from "./components/SignupPanel";
import { WaitlistPanel } from "./components/WaitlistPanel";
import { activities, settlements, topicCards, users } from "./domain/mockData";

type Screen = "home" | "detail" | "signup" | "itinerary" | "juZhang" | "feedback" | "waitlist";
type WaitlistType = "activity" | "juZhang";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");
  const [willingToBeJuZhang, setWillingToBeJuZhang] = useState(false);
  const [juZhangAccepted, setJuZhangAccepted] = useState(false);
  const [juZhangQueued, setJuZhangQueued] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [waitlistType, setWaitlistType] = useState<WaitlistType>("activity");

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
  const topicCard =
    topicCards.find((candidateTopicCard) => candidateTopicCard.activityId === selectedActivity.id) ?? topicCards[0];
  const settlement =
    settlements.find((candidateSettlement) => candidateSettlement.activityId === selectedActivity.id) ?? {
      activityId: selectedActivity.id,
      type: selectedActivity.budgetType,
      totalAmount: 0,
      participantCount: selectedActivity.currentParticipantCount,
      paymentStatusByUser: {},
    };
  const participants = useMemo(
    () => users.filter((user) => selectedActivity.participantIds.includes(user.id)),
    [selectedActivity],
  );
  const isHome = screen === "home";
  const cityImageUrl = `${import.meta.env.BASE_URL}images/city-skyline.jpg`;

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [screen, selectedActivityId]);

  return (
    <main
      className={`app-shell screen-${screen}`}
      style={{ "--city-image": `url(${cityImageUrl})` } as CSSProperties}
    >
      <header className="app-topbar">
        <div>
          <p className="app-location">
            <MapPin size={18} /> 上海 <ChevronDown size={14} />
          </p>
          <p className="app-date">6月5日 周四 18:40</p>
        </div>
        <div className="profile-badge" aria-label="我的">
          L
        </div>
      </header>

      <section className="hero-band">
        {isHome && <div className="city-visual" style={{ backgroundImage: `url(${cityImageUrl})` }} />}
        <p className="eyebrow">City Social Activity Agent</p>
        {isHome ? (
          <h1 className="hero-title" aria-label="先活动，后关系">
            先活动，<span className="hero-accent">后关系</span>
          </h1>
        ) : (
          <p className="hero-title">先活动，后关系</p>
        )}
        <p className="hero-copy">在真实的城市里，认识有趣的人。</p>
      </section>

      {screen === "home" && (
        <ActivityHome
          activities={activities}
          onSelectActivity={(activityId) => {
            setSelectedActivityId(activityId);
            setWillingToBeJuZhang(false);
            setJuZhangAccepted(false);
            setJuZhangQueued(false);
            setPaymentConfirmed(false);
            setScreen("detail");
          }}
        />
      )}

      {screen === "detail" && (
        <ActivityDetail
          activity={selectedActivity}
          participants={participants}
          onBack={() => setScreen("home")}
          onSignup={() => setScreen("signup")}
          onJoinWaitlist={() => {
            setWaitlistType("activity");
            setScreen("waitlist");
          }}
        />
      )}

      {screen === "signup" && (
        <SignupPanel
          activity={selectedActivity}
          willingToBeJuZhang={willingToBeJuZhang}
          onToggleJuZhang={setWillingToBeJuZhang}
          onBack={() => setScreen("detail")}
          onConfirmSignup={() => setScreen("itinerary")}
        />
      )}

      {screen === "itinerary" && (
        <Itinerary
          activity={selectedActivity}
          willingToBeJuZhang={willingToBeJuZhang}
          juZhangQueued={juZhangQueued}
          paymentConfirmed={paymentConfirmed}
          settlement={settlement}
          onBackToDetail={() => setScreen("detail")}
          onApplyJuZhang={() => {
            setJuZhangQueued(true);
            setWaitlistType("juZhang");
            setScreen("waitlist");
          }}
          onOpenJuZhang={() => setScreen("juZhang")}
          onConfirmPayment={() => setPaymentConfirmed(true)}
          onFinishActivity={() => setScreen("feedback")}
        />
      )}

      {screen === "juZhang" && (
        <JuZhangPanel
          activity={selectedActivity}
          topicCard={topicCard}
          settlement={settlement}
          accepted={juZhangAccepted}
          onAccept={() => setJuZhangAccepted(true)}
          onDecline={() => setScreen("itinerary")}
          onFinish={() => setScreen("feedback")}
        />
      )}

      {screen === "feedback" && (
        <FeedbackPanel
          participants={participants}
          onBackToHome={() => {
            setJuZhangAccepted(false);
            setScreen("home");
          }}
        />
      )}

      {screen === "waitlist" && (
        <WaitlistPanel
          activity={selectedActivity}
          type={waitlistType}
          onBackToDetail={() => setScreen("detail")}
          onBackToItinerary={() => setScreen("itinerary")}
        />
      )}

      <nav className="app-tabbar" aria-label="主要导航">
        <a href="#activity-feed" aria-current={screen === "home" ? "page" : undefined}>
          <Compass size={20} /> 发现
        </a>
        <a href="#itinerary" aria-current={screen === "itinerary" ? "page" : undefined}>
          <CalendarCheck2 size={20} /> 行程
        </a>
        <a href="#ju-zhang" aria-current={screen === "juZhang" ? "page" : undefined}>
          <Crown size={20} /> 局长
        </a>
        <a href="#profile">
          <UserRound size={20} /> 我的
        </a>
      </nav>
    </main>
  );
}
