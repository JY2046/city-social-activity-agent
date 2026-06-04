import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { activities, users } from "./domain/mockData";

type Screen = "home" | "detail" | "signup";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
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
        <section className="detail-layout">
          <button className="ghost-button" type="button" onClick={() => setScreen("detail")}>
            <ArrowLeft size={18} /> 返回活动详情
          </button>
          <div className="detail-main signup-placeholder">
            <p className="eyebrow">{selectedActivity.title}</p>
            <h1>报名确认即将接入</h1>
            <p className="hero-copy">Task 5 会在这里接入完整报名面板。</p>
          </div>
        </section>
      )}
    </main>
  );
}
