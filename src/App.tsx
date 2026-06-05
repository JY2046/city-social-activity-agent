import { useMemo, useState } from "react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { Itinerary } from "./components/Itinerary";
import { JuZhangPanel } from "./components/JuZhangPanel";
import { SignupPanel } from "./components/SignupPanel";
import { activities, settlements, topicCards, users } from "./domain/mockData";

type Screen = "home" | "detail" | "signup" | "itinerary" | "juZhang" | "feedback";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");
  const [willingToBeJuZhang, setWillingToBeJuZhang] = useState(false);
  const [juZhangAccepted, setJuZhangAccepted] = useState(false);

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

  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        {isHome ? (
          <h1 className="hero-title">先活动，后关系</h1>
        ) : (
          <p className="hero-title">先活动，后关系</p>
        )}
        <p className="hero-copy">
          一个帮助年轻上班族安全加入饭局、咖啡局和小酒馆局的城市轻社交原型。
        </p>
      </section>

      {screen === "home" && (
        <ActivityHome
          activities={activities}
          onSelectActivity={(activityId) => {
            setSelectedActivityId(activityId);
            setWillingToBeJuZhang(false);
            setJuZhangAccepted(false);
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
          onOpenJuZhang={() => setScreen("juZhang")}
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
    </main>
  );
}
