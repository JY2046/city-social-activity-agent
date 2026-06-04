# City Social Activity MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clickable user-side MVP prototype for an AI-assisted city social activity platform focused on dinner, coffee, bar, and free city activities.

**Architecture:** Use a Vite React TypeScript app with local mock data and pure domain helpers. Keep product rules in `src/domain`, UI sections in `src/components`, and page orchestration in `src/App.tsx` so the prototype can evolve without a backend.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, plain CSS.

---

## File Structure

- Create `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: project tooling.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`: top-level prototype state, selected activity, selected screen.
- Create `src/styles.css`: responsive visual design for the prototype.
- Create `src/domain/types.ts`: shared domain types.
- Create `src/domain/mockData.ts`: four activity samples, users, registrations, topic cards.
- Create `src/domain/rules.ts`: pure functions for activity status, participant preview, ju zhang eligibility, cancellation windows, settlement, mutual contact.
- Create `src/components/ActivityHome.tsx`: activity feed.
- Create `src/components/ActivityDetail.tsx`: activity details and participant preview.
- Create `src/components/SignupPanel.tsx`: signup confirmation and ju zhang opt-in.
- Create `src/components/Itinerary.tsx`: post-signup itinerary and status page.
- Create `src/components/JuZhangPanel.tsx`: ju zhang accept/refuse, task cards, topic card, settlement.
- Create `src/components/FeedbackPanel.tsx`: post-event feedback and mutual contact.
- Create `src/domain/rules.test.ts`: unit tests for product rules.
- Create `src/App.test.tsx`: interaction tests for the main flow.

## Task 1: Scaffold React/Vite Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create the Vite React TypeScript project files**

Create `package.json`:

```json
{
  "name": "city-social-activity-agent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>City Social Activity Agent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
  },
});
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create initial `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        <h1>先活动，后关系</h1>
        <p className="hero-copy">
          一个帮助年轻上班族安全加入饭局、咖啡局和小酒馆局的城市轻社交原型。
        </p>
      </section>
    </main>
  );
}
```

Create initial `src/styles.css`:

```css
:root {
  color: #1f2933;
  background: #f7f4ef;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(120deg, rgba(45, 95, 93, 0.12), transparent 34%),
    linear-gradient(240deg, rgba(201, 88, 73, 0.12), transparent 36%),
    #f7f4ef;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
}

.hero-band {
  padding: 48px clamp(20px, 5vw, 72px) 28px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #2d5f5d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  max-width: 720px;
  color: #16211f;
  font-size: clamp(42px, 8vw, 84px);
  line-height: 0.95;
  letter-spacing: 0;
}

.hero-copy {
  max-width: 560px;
  margin: 18px 0 0;
  color: #54615f;
  font-size: 18px;
  line-height: 1.7;
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: exits with code 0 and creates `package-lock.json`.

- [ ] **Step 3: Run the initial build**

Run:

```bash
npm run build
```

Expected: exits with code 0 and creates `dist/`.

- [ ] **Step 4: Commit scaffolding**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold city activity prototype"
```

Expected: commit succeeds.

## Task 2: Add Domain Types and Mock Data

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/mockData.ts`
- Create: `src/domain/rules.test.ts`

- [ ] **Step 1: Write failing tests for mock data shape**

Create `src/domain/rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { activities, users } from "./mockData";

describe("mock data", () => {
  it("contains paid and free activities for the MVP scenarios", () => {
    expect(activities).toHaveLength(4);
    expect(activities.some((activity) => activity.budgetType === "paid")).toBe(true);
    expect(activities.some((activity) => activity.budgetType === "free")).toBe(true);
  });

  it("lets users choose whether attended event count is visible", () => {
    expect(users.some((user) => user.showAttendedEventCount)).toBe(true);
    expect(users.some((user) => !user.showAttendedEventCount)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/domain/rules.test.ts
```

Expected: FAIL because `src/domain/mockData.ts` does not exist.

- [ ] **Step 3: Add domain types**

Create `src/domain/types.ts`:

```ts
export type ActivityType = "dinner" | "coffee" | "bar" | "walk";
export type BudgetType = "paid" | "free";
export type FormationStatus = "forming" | "nearly_full" | "formed" | "ongoing" | "ended" | "cancelled";
export type RegistrationStatus = "registered" | "waitlisted" | "cancelled" | "confirmed" | "arrived" | "completed" | "noShow";
export type JuZhangStatus = "candidate" | "invited" | "accepted" | "declined" | "active" | "completed" | "withdrawn" | "replaced";
export type ReputationLevel = "新朋友" | "可信参与者" | "优质参与者" | "局长" | "靠谱局长";

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  interests: string[];
  bio: string;
  reputationLevel: ReputationLevel;
  attendedEventCount: number;
  showAttendedEventCount: boolean;
  badges: string[];
  canBeJuZhang: boolean;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  startsAt: string;
  area: string;
  venue: string;
  budgetType: BudgetType;
  estimatedCost: number;
  capacity: number;
  currentParticipantCount: number;
  formationStatus: FormationStatus;
  aiRecommendationReason: string;
  aaRule: string;
  cancellationRule: string;
  privacyRule: string;
  requiresSettlement: boolean;
  participantIds: string[];
}

export interface Registration {
  id: string;
  userId: string;
  activityId: string;
  status: RegistrationStatus;
  willingToBeJuZhang: boolean;
}

export interface TopicCard {
  id: string;
  activityId: string;
  visibleText: string;
}

export interface JuZhangAssignment {
  id: string;
  activityId: string;
  candidateUserId: string;
  status: JuZhangStatus;
  volunteered: boolean;
}

export interface Settlement {
  activityId: string;
  type: BudgetType;
  totalAmount: number;
  participantCount: number;
  paymentStatusByUser: Record<string, boolean>;
}
```

- [ ] **Step 4: Add mock data**

Create `src/domain/mockData.ts`:

```ts
import type { Activity, JuZhangAssignment, Registration, Settlement, TopicCard, User } from "./types";

export const users: User[] = [
  {
    id: "u-lin",
    nickname: "林夏",
    avatar: "LX",
    interests: ["日料", "城市散步", "独立书店"],
    bio: "刚换到静安上班，想认识下班后能轻松吃饭聊天的人。",
    reputationLevel: "可信参与者",
    attendedEventCount: 7,
    showAttendedEventCount: true,
    badges: ["准时到场"],
    canBeJuZhang: true,
  },
  {
    id: "u-chen",
    nickname: "陈予",
    avatar: "CY",
    interests: ["咖啡", "摄影", "展览"],
    bio: "周末喜欢找安静地方聊天，也喜欢城市观察。",
    reputationLevel: "优质参与者",
    attendedEventCount: 12,
    showAttendedEventCount: true,
    badges: ["友好破冰"],
    canBeJuZhang: true,
  },
  {
    id: "u-momo",
    nickname: "Momo",
    avatar: "MO",
    interests: ["小酒馆", "电影", "爵士"],
    bio: "喜欢低压力社交，不太想进大群。",
    reputationLevel: "新朋友",
    attendedEventCount: 1,
    showAttendedEventCount: false,
    badges: [],
    canBeJuZhang: true,
  },
  {
    id: "u-qiao",
    nickname: "乔一",
    avatar: "QY",
    interests: ["徒步", "咖啡", "设计"],
    bio: "希望认识生活节奏相近的新朋友。",
    reputationLevel: "靠谱局长",
    attendedEventCount: 18,
    showAttendedEventCount: true,
    badges: ["靠谱局长"],
    canBeJuZhang: true,
  },
];

export const activities: Activity[] = [
  {
    id: "a-sushi",
    title: "周五下班日料小局",
    type: "dinner",
    startsAt: "2026-06-05T19:30:00+08:00",
    area: "静安寺",
    venue: "若竹日料",
    budgetType: "paid",
    estimatedCost: 168,
    capacity: 6,
    currentParticipantCount: 5,
    formationStatus: "formed",
    aiRecommendationReason: "适合想下班后轻松吃饭、但不想进入大群聊天的人。",
    aaRule: "线下 AA，局长协助确认账单和支付状态。",
    cancellationRule: "普通参与者 12 小时内退出会影响内部信誉；局长接受后 24 小时内退出会触发替换。",
    privacyRule: "活动前不开放私信和联系方式，活动后双方互选才开放联系。",
    requiresSettlement: true,
    participantIds: ["u-lin", "u-chen", "u-momo", "u-qiao"],
  },
  {
    id: "a-coffee",
    title: "周末咖啡聊天局",
    type: "coffee",
    startsAt: "2026-06-06T15:00:00+08:00",
    area: "武康路",
    venue: "梧桐边咖啡",
    budgetType: "paid",
    estimatedCost: 58,
    capacity: 5,
    currentParticipantCount: 3,
    formationStatus: "nearly_full",
    aiRecommendationReason: "人数少、预算轻，适合第一次尝试陌生人轻社交。",
    aaRule: "各自点单，现场自行支付。",
    cancellationRule: "普通参与者 12 小时外可自由退出。",
    privacyRule: "只展示适度资料，不默认拉群。",
    requiresSettlement: true,
    participantIds: ["u-chen", "u-qiao"],
  },
  {
    id: "a-bar",
    title: "小酒馆微醺聊天局",
    type: "bar",
    startsAt: "2026-06-06T20:30:00+08:00",
    area: "陕西南路",
    venue: "三楼小酒馆",
    budgetType: "paid",
    estimatedCost: 120,
    capacity: 6,
    currentParticipantCount: 4,
    formationStatus: "forming",
    aiRecommendationReason: "适合愿意轻松聊天的人，系统会强调边界和安全规则。",
    aaRule: "线下 AA，不强制拼酒。",
    cancellationRule: "临近活动退出会影响内部信誉。",
    privacyRule: "活动前不开放联系方式，异常可随时反馈。",
    requiresSettlement: true,
    participantIds: ["u-lin", "u-momo"],
  },
  {
    id: "a-walk",
    title: "免费城市散步局",
    type: "walk",
    startsAt: "2026-06-07T10:00:00+08:00",
    area: "苏州河",
    venue: "四行仓库集合",
    budgetType: "free",
    estimatedCost: 0,
    capacity: 8,
    currentParticipantCount: 6,
    formationStatus: "formed",
    aiRecommendationReason: "费用为 0，适合想低门槛体验平台活动的新用户。",
    aaRule: "本活动无费用。",
    cancellationRule: "普通参与者 12 小时外可自由退出。",
    privacyRule: "活动后双方互选才开放联系方式。",
    requiresSettlement: false,
    participantIds: ["u-lin", "u-chen", "u-qiao"],
  },
];

export const registrations: Registration[] = [
  { id: "r-1", userId: "u-lin", activityId: "a-sushi", status: "confirmed", willingToBeJuZhang: true },
  { id: "r-2", userId: "u-chen", activityId: "a-sushi", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-3", userId: "u-qiao", activityId: "a-sushi", status: "arrived", willingToBeJuZhang: true },
];

export const juZhangAssignments: JuZhangAssignment[] = [
  { id: "jz-1", activityId: "a-sushi", candidateUserId: "u-qiao", status: "accepted", volunteered: true },
];

export const topicCards: TopicCard[] = [
  {
    id: "topic-sushi",
    activityId: "a-sushi",
    visibleText: "如果只能把上海一个下班后最放松的地方推荐给新朋友，你会选哪里？",
  },
  {
    id: "topic-coffee",
    activityId: "a-coffee",
    visibleText: "最近有没有一个让你愿意专门出门的咖啡馆、展览或小店？",
  },
  {
    id: "topic-bar",
    activityId: "a-bar",
    visibleText: "你更喜欢热闹小酒馆，还是能安静聊天的小吧台？",
  },
  {
    id: "topic-walk",
    activityId: "a-walk",
    visibleText: "你在这座城市里最喜欢的一段路是哪一段？",
  },
];

export const settlements: Settlement[] = [
  {
    activityId: "a-sushi",
    type: "paid",
    totalAmount: 840,
    participantCount: 5,
    paymentStatusByUser: {
      "u-lin": true,
      "u-chen": true,
      "u-momo": false,
      "u-qiao": true,
    },
  },
  {
    activityId: "a-walk",
    type: "free",
    totalAmount: 0,
    participantCount: 6,
    paymentStatusByUser: {},
  },
];
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- src/domain/rules.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit domain data**

Run:

```bash
git add src/domain/types.ts src/domain/mockData.ts src/domain/rules.test.ts
git commit -m "feat: add activity domain data"
```

Expected: commit succeeds.

## Task 3: Add Product Rule Helpers

**Files:**
- Modify: `src/domain/rules.test.ts`
- Create: `src/domain/rules.ts`

- [ ] **Step 1: Add failing rule tests**

Replace `src/domain/rules.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { activities, registrations, settlements, users } from "./mockData";
import {
  canCancelWithoutPenalty,
  getParticipantPreview,
  getSettlementSummary,
  getVisibleJuZhangCandidates,
  isMutualContact,
} from "./rules";

describe("mock data", () => {
  it("contains paid and free activities for the MVP scenarios", () => {
    expect(activities).toHaveLength(4);
    expect(activities.some((activity) => activity.budgetType === "paid")).toBe(true);
    expect(activities.some((activity) => activity.budgetType === "free")).toBe(true);
  });

  it("lets users choose whether attended event count is visible", () => {
    expect(users.some((user) => user.showAttendedEventCount)).toBe(true);
    expect(users.some((user) => !user.showAttendedEventCount)).toBe(true);
  });
});

describe("activity rules", () => {
  it("shows attended event count only when the user opts in", () => {
    const visible = getParticipantPreview(users[0]);
    const hidden = getParticipantPreview(users[2]);

    expect(visible.attendedEventLabel).toBe("参加过 7 场活动");
    expect(hidden.attendedEventLabel).toBe("活动经历未公开");
  });

  it("uses 12 hours for participant cancellation and 24 hours for ju zhang cancellation", () => {
    const start = new Date("2026-06-05T19:30:00+08:00");
    const participantTime = new Date("2026-06-05T06:00:00+08:00");
    const lateParticipantTime = new Date("2026-06-05T12:00:00+08:00");
    const juZhangTime = new Date("2026-06-04T18:00:00+08:00");

    expect(canCancelWithoutPenalty(start, participantTime, "participant")).toBe(true);
    expect(canCancelWithoutPenalty(start, lateParticipantTime, "participant")).toBe(false);
    expect(canCancelWithoutPenalty(start, juZhangTime, "juZhang")).toBe(false);
  });

  it("prioritizes eligible volunteers for ju zhang", () => {
    const candidates = getVisibleJuZhangCandidates(users, registrations, "a-sushi");

    expect(candidates[0].id).toBe("u-qiao");
    expect(candidates.every((user) => user.canBeJuZhang)).toBe(true);
  });

  it("calculates paid settlement and hides money work for free activities", () => {
    const paid = getSettlementSummary(settlements[0]);
    const free = getSettlementSummary(settlements[1]);

    expect(paid.label).toBe("人均 168 元");
    expect(paid.unpaidCount).toBe(1);
    expect(free.label).toBe("本活动无费用");
    expect(free.unpaidCount).toBe(0);
  });

  it("opens contact only when both users choose each other", () => {
    expect(isMutualContact("u-lin", "u-chen", { "u-lin": ["u-chen"], "u-chen": ["u-lin"] })).toBe(true);
    expect(isMutualContact("u-lin", "u-momo", { "u-lin": ["u-momo"], "u-momo": [] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/domain/rules.test.ts
```

Expected: FAIL because `src/domain/rules.ts` does not exist.

- [ ] **Step 3: Add rule helpers**

Create `src/domain/rules.ts`:

```ts
import type { Registration, Settlement, User } from "./types";

export type CancellationRole = "participant" | "juZhang";

export interface ParticipantPreview {
  nickname: string;
  avatar: string;
  interests: string[];
  bio: string;
  reputationLevel: string;
  attendedEventLabel: string;
  badges: string[];
}

export interface SettlementSummary {
  label: string;
  unpaidCount: number;
  isFree: boolean;
}

export function getParticipantPreview(user: User): ParticipantPreview {
  return {
    nickname: user.nickname,
    avatar: user.avatar,
    interests: user.interests,
    bio: user.bio,
    reputationLevel: user.reputationLevel,
    attendedEventLabel: user.showAttendedEventCount ? `参加过 ${user.attendedEventCount} 场活动` : "活动经历未公开",
    badges: user.badges,
  };
}

export function canCancelWithoutPenalty(startsAt: Date, now: Date, role: CancellationRole): boolean {
  const hoursBeforeStart = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const requiredHours = role === "juZhang" ? 24 : 12;
  return hoursBeforeStart > requiredHours;
}

export function getVisibleJuZhangCandidates(users: User[], registrations: Registration[], activityId: string): User[] {
  const registrationByUser = new Map(
    registrations.filter((registration) => registration.activityId === activityId).map((registration) => [registration.userId, registration]),
  );

  return users
    .filter((user) => user.canBeJuZhang && registrationByUser.has(user.id))
    .sort((left, right) => {
      const leftRegistration = registrationByUser.get(left.id);
      const rightRegistration = registrationByUser.get(right.id);
      const leftVolunteerScore = leftRegistration?.willingToBeJuZhang ? 1 : 0;
      const rightVolunteerScore = rightRegistration?.willingToBeJuZhang ? 1 : 0;

      if (leftVolunteerScore !== rightVolunteerScore) {
        return rightVolunteerScore - leftVolunteerScore;
      }

      return right.attendedEventCount - left.attendedEventCount;
    });
}

export function getSettlementSummary(settlement: Settlement): SettlementSummary {
  if (settlement.type === "free" || settlement.totalAmount === 0) {
    return {
      label: "本活动无费用",
      unpaidCount: 0,
      isFree: true,
    };
  }

  const perPersonAmount = Math.round(settlement.totalAmount / settlement.participantCount);
  const unpaidCount = Object.values(settlement.paymentStatusByUser).filter((hasPaid) => !hasPaid).length;

  return {
    label: `人均 ${perPersonAmount} 元`,
    unpaidCount,
    isFree: false,
  };
}

export function isMutualContact(
  firstUserId: string,
  secondUserId: string,
  selections: Record<string, string[]>,
): boolean {
  return selections[firstUserId]?.includes(secondUserId) === true && selections[secondUserId]?.includes(firstUserId) === true;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/domain/rules.test.ts
```

Expected: PASS with 7 tests.

- [ ] **Step 5: Commit rule helpers**

Run:

```bash
git add src/domain/rules.ts src/domain/rules.test.ts
git commit -m "feat: add product rule helpers"
```

Expected: commit succeeds.

## Task 4: Build Activity Discovery and Detail Flow

**Files:**
- Create: `src/components/ActivityHome.tsx`
- Create: `src/components/ActivityDetail.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Add failing UI tests for home and detail**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App discovery flow", () => {
  it("opens an activity detail page from the feed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));

    expect(screen.getByRole("heading", { name: "周五下班日料小局" })).toBeInTheDocument();
    expect(screen.getByText("活动前不开放私信和联系方式，活动后双方互选才开放联系。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test to verify failure**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the activity feed is not implemented.

- [ ] **Step 3: Add activity home component**

Create `src/components/ActivityHome.tsx`:

```tsx
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
            <CalendarDays size={16} /> {new Date(activity.startsAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="muted">
            <MapPin size={16} /> {activity.area} · {activity.venue}
          </p>
          <p className="muted">
            <Users size={16} /> {activity.currentParticipantCount}/{activity.capacity} 人 · {activity.formationStatus === "formed" ? "已成局" : "报名中"}
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
```

- [ ] **Step 4: Add detail component**

Create `src/components/ActivityDetail.tsx`:

```tsx
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
        <p className="eyebrow">{activity.area} · {activity.budgetType === "free" ? "免费活动" : `人均约 ${activity.estimatedCost} 元`}</p>
        <h1>{activity.title}</h1>
        <p className="hero-copy">{activity.aiRecommendationReason}</p>
      </div>
      <div className="detail-columns">
        <section className="info-panel">
          <h2>活动规则</h2>
          <p>{activity.aaRule}</p>
          <p>{activity.cancellationRule}</p>
          <p>{activity.privacyRule}</p>
          <button className="primary-button" type="button" onClick={onSignup}>报名并确认规则</button>
        </section>
        <section className="info-panel">
          <h2><ShieldCheck size={20} /> 参与者预览</h2>
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
                  <p className="tag-line">{participant.interests.map((interest) => <span key={interest}>{interest}</span>)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire App state**

Replace `src/App.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { activities, users } from "./domain/mockData";

type Screen = "home" | "detail";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
  const participants = useMemo(
    () => users.filter((user) => selectedActivity.participantIds.includes(user.id)),
    [selectedActivity],
  );

  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        <h1>先活动，后关系</h1>
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
          onSignup={() => setScreen("detail")}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Add component styles**

Append to `src/styles.css`:

```css
.content-grid,
.detail-layout {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 56px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.activity-card,
.info-panel {
  border: 1px solid rgba(31, 41, 51, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 18px 60px rgba(31, 41, 51, 0.08);
}

.activity-card {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.activity-card h2,
.info-panel h2,
.participant-row h3 {
  margin: 0;
  letter-spacing: 0;
}

.card-topline,
.tag-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-topline span,
.tag-line span {
  border-radius: 999px;
  background: #e8f1ee;
  color: #2d5f5d;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
}

.muted,
.ai-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: #5d6866;
  line-height: 1.5;
}

.ai-note {
  margin-top: auto;
  color: #8a4c38;
}

.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0 16px;
  font-weight: 800;
}

.primary-button {
  background: #1f4f4d;
  color: white;
}

.ghost-button {
  background: transparent;
  color: #1f4f4d;
}

.detail-layout {
  display: grid;
  gap: 20px;
}

.detail-main {
  padding: 8px 0 4px;
}

.detail-columns {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 16px;
}

.info-panel {
  padding: 20px;
}

.participant-list {
  display: grid;
  gap: 12px;
}

.participant-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  border-top: 1px solid rgba(31, 41, 51, 0.1);
  padding-top: 12px;
}

.avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  background: #c95849;
  color: white;
  font-weight: 900;
}

@media (max-width: 760px) {
  .detail-columns {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 8: Commit discovery flow**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/ActivityHome.tsx src/components/ActivityDetail.tsx src/styles.css
git commit -m "feat: add activity discovery flow"
```

Expected: commit succeeds.

## Task 5: Add Signup and Itinerary Flow

**Files:**
- Create: `src/components/SignupPanel.tsx`
- Create: `src/components/Itinerary.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add failing signup flow test**

Append to `src/App.test.tsx`:

```tsx
describe("App signup flow", () => {
  it("confirms signup rules and opens itinerary", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByLabelText("我愿意担任局长"));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));

    expect(screen.getByRole("heading", { name: "活动行程" })).toBeInTheDocument();
    expect(screen.getByText("已勾选愿意担任局长，系统会在活动前 24 小时内选择。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because signup and itinerary screens are not implemented.

- [ ] **Step 3: Add signup panel**

Create `src/components/SignupPanel.tsx`:

```tsx
import type { Activity } from "../domain/types";

interface SignupPanelProps {
  activity: Activity;
  willingToBeJuZhang: boolean;
  onToggleJuZhang: (value: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function SignupPanel({ activity, willingToBeJuZhang, onToggleJuZhang, onBack, onConfirm }: SignupPanelProps) {
  return (
    <section className="flow-panel">
      <button className="ghost-button" type="button" onClick={onBack}>返回详情</button>
      <p className="eyebrow">报名确认</p>
      <h1>{activity.title}</h1>
      <div className="rule-list">
        <p>{activity.budgetType === "free" ? "本活动费用为 0，不需要 AA 结算。" : activity.aaRule}</p>
        <p>普通参与者活动开始前 12 小时外可自由退出。</p>
        <p>活动前不开放私信和联系方式，活动后双方互选才开放联系。</p>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={willingToBeJuZhang}
          onChange={(event) => onToggleJuZhang(event.target.checked)}
        />
        我愿意担任局长
      </label>
      <p className="muted">局长可以拒绝，拒绝不影响继续参加活动；接受后会收到 AI 任务卡。</p>
      <button className="primary-button" type="button" onClick={onConfirm}>确认报名</button>
    </section>
  );
}
```

- [ ] **Step 4: Add itinerary panel**

Create `src/components/Itinerary.tsx`:

```tsx
import { Clock, MapPin, Users } from "lucide-react";
import type { Activity } from "../domain/types";

interface ItineraryProps {
  activity: Activity;
  willingToBeJuZhang: boolean;
  onOpenJuZhang: () => void;
  onFinishActivity: () => void;
}

export function Itinerary({ activity, willingToBeJuZhang, onOpenJuZhang, onFinishActivity }: ItineraryProps) {
  return (
    <section className="flow-panel">
      <p className="eyebrow">报名成功</p>
      <h1>活动行程</h1>
      <div className="status-grid">
        <p><Clock size={18} /> {new Date(activity.startsAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        <p><MapPin size={18} /> {activity.area} · {activity.venue}</p>
        <p><Users size={18} /> {activity.currentParticipantCount}/{activity.capacity} 人 · 已成局</p>
      </div>
      <p className="ai-note">AI 提醒：活动前 30 分钟确认到场；迟到可以在这里同步状态，不需要拉群。</p>
      <p>{willingToBeJuZhang ? "已勾选愿意担任局长，系统会在活动前 24 小时内选择。" : "你没有勾选局长，仍可正常参加活动。"}</p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={onOpenJuZhang}>查看局长任务</button>
        <button className="ghost-button" type="button" onClick={onFinishActivity}>模拟活动结束</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Update App state**

Modify `src/App.tsx` so `Screen` and render branches include signup and itinerary:

```tsx
import { useMemo, useState } from "react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { Itinerary } from "./components/Itinerary";
import { SignupPanel } from "./components/SignupPanel";
import { activities, users } from "./domain/mockData";

type Screen = "home" | "detail" | "signup" | "itinerary";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");
  const [willingToBeJuZhang, setWillingToBeJuZhang] = useState(false);

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
  const participants = useMemo(
    () => users.filter((user) => selectedActivity.participantIds.includes(user.id)),
    [selectedActivity],
  );

  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        <h1>先活动，后关系</h1>
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
        <SignupPanel
          activity={selectedActivity}
          willingToBeJuZhang={willingToBeJuZhang}
          onToggleJuZhang={setWillingToBeJuZhang}
          onBack={() => setScreen("detail")}
          onConfirm={() => setScreen("itinerary")}
        />
      )}

      {screen === "itinerary" && (
        <Itinerary
          activity={selectedActivity}
          willingToBeJuZhang={willingToBeJuZhang}
          onOpenJuZhang={() => setScreen("itinerary")}
          onFinishActivity={() => setScreen("itinerary")}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Add flow styles**

Append to `src/styles.css`:

```css
.flow-panel {
  display: grid;
  gap: 16px;
  width: min(760px, calc(100% - 32px));
  margin: 0 auto 56px;
  border: 1px solid rgba(31, 41, 51, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  padding: 24px;
  box-shadow: 0 18px 60px rgba(31, 41, 51, 0.08);
}

.rule-list,
.status-grid {
  display: grid;
  gap: 10px;
}

.status-grid p,
.check-row,
.button-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.check-row {
  min-height: 48px;
  font-weight: 800;
}

.check-row input {
  width: 20px;
  height: 20px;
  accent-color: #1f4f4d;
}

.button-row {
  flex-wrap: wrap;
}
```

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 8: Commit signup flow**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/SignupPanel.tsx src/components/Itinerary.tsx src/styles.css
git commit -m "feat: add signup and itinerary flow"
```

Expected: commit succeeds.

## Task 6: Add Ju Zhang Task and Settlement Flow

**Files:**
- Create: `src/components/JuZhangPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add failing ju zhang test**

Append to `src/App.test.tsx`:

```tsx
describe("Ju Zhang flow", () => {
  it("lets the selected user accept ju zhang tasks and see settlement", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByLabelText("我愿意担任局长"));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));
    await userEvent.click(screen.getByRole("button", { name: "接受局长" }));

    expect(screen.getByText("如果只能把上海一个下班后最放松的地方推荐给新朋友，你会选哪里？")).toBeInTheDocument();
    expect(screen.getByText("人均 168 元")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `JuZhangPanel` is not implemented.

- [ ] **Step 3: Add JuZhangPanel component**

Create `src/components/JuZhangPanel.tsx`:

```tsx
import { CheckCircle2, MessageCircle, ReceiptText, UserRoundCheck } from "lucide-react";
import { getSettlementSummary } from "../domain/rules";
import type { Activity, Settlement, TopicCard } from "../domain/types";

interface JuZhangPanelProps {
  activity: Activity;
  topicCard: TopicCard;
  settlement: Settlement;
  accepted: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onFinish: () => void;
}

export function JuZhangPanel({ activity, topicCard, settlement, accepted, onAccept, onDecline, onFinish }: JuZhangPanelProps) {
  const settlementSummary = getSettlementSummary(settlement);

  return (
    <section className="flow-panel">
      <p className="eyebrow">局长任务</p>
      <h1>局长不是组织者，只是本局的小帮手</h1>
      {!accepted && (
        <div className="button-row">
          <button className="primary-button" type="button" onClick={onAccept}>接受局长</button>
          <button className="ghost-button" type="button" onClick={onDecline}>拒绝，不影响参加</button>
        </div>
      )}
      {accepted && (
        <div className="task-list">
          <article className="task-card">
            <UserRoundCheck size={20} />
            <div>
              <h2>到场确认</h2>
              <p>到达后点一下已到，帮助大家知道本局有人在现场。</p>
            </div>
          </article>
          <article className="task-card">
            <MessageCircle size={20} />
            <div>
              <h2>AI 话题卡</h2>
              <p>{topicCard.visibleText}</p>
            </div>
          </article>
          <article className="task-card">
            <ReceiptText size={20} />
            <div>
              <h2>{activity.requiresSettlement ? "AA 结算" : "费用确认"}</h2>
              <p>{settlementSummary.label}</p>
              <p>{settlementSummary.isFree ? "本活动无需确认支付状态。" : `还有 ${settlementSummary.unpaidCount} 人未确认支付。`}</p>
            </div>
          </article>
          <button className="primary-button" type="button" onClick={onFinish}>
            <CheckCircle2 size={18} /> 完成局长任务
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Wire ju zhang screen**

Modify `src/App.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ActivityDetail } from "./components/ActivityDetail";
import { ActivityHome } from "./components/ActivityHome";
import { Itinerary } from "./components/Itinerary";
import { JuZhangPanel } from "./components/JuZhangPanel";
import { SignupPanel } from "./components/SignupPanel";
import { activities, settlements, topicCards, users } from "./domain/mockData";

type Screen = "home" | "detail" | "signup" | "itinerary" | "juZhang";

export default function App() {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0].id);
  const [screen, setScreen] = useState<Screen>("home");
  const [willingToBeJuZhang, setWillingToBeJuZhang] = useState(false);
  const [juZhangAccepted, setJuZhangAccepted] = useState(false);

  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
  const participants = useMemo(
    () => users.filter((user) => selectedActivity.participantIds.includes(user.id)),
    [selectedActivity],
  );
  const topicCard = topicCards.find((topic) => topic.activityId === selectedActivity.id) ?? topicCards[0];
  const settlement = settlements.find((item) => item.activityId === selectedActivity.id) ?? {
    activityId: selectedActivity.id,
    type: selectedActivity.budgetType,
    totalAmount: 0,
    participantCount: selectedActivity.currentParticipantCount,
    paymentStatusByUser: {},
  };

  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        <h1>先活动，后关系</h1>
        <p className="hero-copy">
          一个帮助年轻上班族安全加入饭局、咖啡局和小酒馆局的城市轻社交原型。
        </p>
      </section>

      {screen === "home" && (
        <ActivityHome
          activities={activities}
          onSelectActivity={(activityId) => {
            setSelectedActivityId(activityId);
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
          onConfirm={() => setScreen("itinerary")}
        />
      )}

      {screen === "itinerary" && (
        <Itinerary
          activity={selectedActivity}
          willingToBeJuZhang={willingToBeJuZhang}
          onOpenJuZhang={() => setScreen("juZhang")}
          onFinishActivity={() => setScreen("itinerary")}
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
          onFinish={() => setScreen("itinerary")}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Add task card styles**

Append to `src/styles.css`:

```css
.task-list {
  display: grid;
  gap: 12px;
}

.task-card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
  border: 1px solid rgba(31, 41, 51, 0.12);
  border-radius: 8px;
  background: #fbfaf7;
  padding: 16px;
}

.task-card h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.task-card p {
  margin: 0 0 6px;
  color: #52605e;
  line-height: 1.55;
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test -- src/App.test.tsx src/domain/rules.test.ts
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit ju zhang flow**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/JuZhangPanel.tsx src/styles.css
git commit -m "feat: add ju zhang task flow"
```

Expected: commit succeeds.

## Task 7: Add Feedback and Mutual Contact Flow

**Files:**
- Create: `src/components/FeedbackPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add failing feedback test**

Append to `src/App.test.tsx`:

```tsx
describe("feedback and mutual contact flow", () => {
  it("shows mutual contact only after activity feedback", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "模拟活动结束" }));

    expect(screen.getByRole("heading", { name: "活动反馈与互选" })).toBeInTheDocument();
    expect(screen.getByText("双方都选择后才开放联系方式。")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because feedback screen is not implemented.

- [ ] **Step 3: Add feedback component**

Create `src/components/FeedbackPanel.tsx`:

```tsx
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
                <label className="check-row" key={participant.id}>
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
      <button className="primary-button" type="button" onClick={onBackToHome}>完成反馈</button>
    </section>
  );
}
```

- [ ] **Step 4: Wire feedback screen**

Modify `src/App.tsx` so `Screen` includes feedback and the itinerary finish button opens it:

```tsx
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
  const participants = useMemo(
    () => users.filter((user) => selectedActivity.participantIds.includes(user.id)),
    [selectedActivity],
  );
  const topicCard = topicCards.find((topic) => topic.activityId === selectedActivity.id) ?? topicCards[0];
  const settlement = settlements.find((item) => item.activityId === selectedActivity.id) ?? {
    activityId: selectedActivity.id,
    type: selectedActivity.budgetType,
    totalAmount: 0,
    participantCount: selectedActivity.currentParticipantCount,
    paymentStatusByUser: {},
  };

  return (
    <main className="app-shell">
      <section className="hero-band">
        <p className="eyebrow">City Social Activity Agent</p>
        <h1>先活动，后关系</h1>
        <p className="hero-copy">
          一个帮助年轻上班族安全加入饭局、咖啡局和小酒馆局的城市轻社交原型。
        </p>
      </section>

      {screen === "home" && (
        <ActivityHome
          activities={activities}
          onSelectActivity={(activityId) => {
            setSelectedActivityId(activityId);
            setJuZhangAccepted(false);
            setWillingToBeJuZhang(false);
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
          onConfirm={() => setScreen("itinerary")}
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
          onBackToHome={() => setScreen("home")}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Add feedback styles**

Append to `src/styles.css`:

```css
.feedback-grid {
  display: grid;
  gap: 12px;
}

.participant-list.compact {
  margin-top: 8px;
}

.feedback-input {
  min-height: 116px;
  width: 100%;
  resize: vertical;
  border: 1px solid rgba(31, 41, 51, 0.18);
  border-radius: 8px;
  padding: 12px;
  background: white;
  color: #1f2933;
  line-height: 1.5;
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit feedback flow**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/FeedbackPanel.tsx src/styles.css
git commit -m "feat: add feedback and mutual contact flow"
```

Expected: commit succeeds.

## Task 8: Final Visual QA and Push

**Files:**
- Modify: `src/styles.css` if visual QA finds text overflow, unreadable contrast, or mobile layout issues.
- Modify: `README.md`

- [ ] **Step 1: Add README**

Create `README.md`:

````md
# City Social Activity Agent

Clickable MVP prototype for an AI-assisted city social activity platform.

## Current Scope

- Activity discovery for dinner, coffee, bar, and free city activities
- Moderate participant preview with user-controlled activity history
- Signup rules for AA, privacy, and cancellation windows
- Ju Zhang role flow with AI topic card and settlement support
- Feedback and mutual contact after the event

## Run Locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```
````

- [ ] **Step 2: Run all checks**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL such as `http://localhost:5173/`.

- [ ] **Step 4: Browser QA desktop**

Open the local URL in the Codex in-app browser. Verify:

- The home feed shows four activity cards.
- Activity detail opens from “周五下班日料小局”.
- Signup checkbox text fits on mobile and desktop.
- Itinerary shows the ju zhang note after signup.
- Ju Zhang task screen shows topic card and AA settlement.
- Feedback page shows mutual contact and abnormal feedback sections.

- [ ] **Step 5: Browser QA mobile**

Set the browser viewport to 390 by 844. Verify:

- Cards stack vertically.
- No text overlaps.
- Buttons stay within their containers.
- Detail columns collapse into one column.

- [ ] **Step 6: Fix any visual QA issues with targeted CSS**

If text overflows in `.primary-button`, `.ghost-button`, `.activity-card`, or `.flow-panel`, update `src/styles.css` with:

```css
.primary-button,
.ghost-button {
  white-space: normal;
  text-align: center;
}

.activity-card,
.flow-panel,
.info-panel,
.task-card {
  overflow-wrap: anywhere;
}
```

Run:

```bash
npm test
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit README and visual fixes**

Run:

```bash
git add README.md src/styles.css
git commit -m "docs: add prototype run instructions"
```

Expected: commit succeeds. If `src/styles.css` did not change in QA, commit only `README.md`.

- [ ] **Step 8: Push to GitHub**

Run:

```bash
git push -u origin main
```

Expected: push succeeds to `https://github.com/JY2046/city-social-activity-agent`.

## Self-Review

- Spec coverage: The plan covers activity discovery, detail, signup, itinerary, ju zhang, AI topic card, AA/free settlement, feedback, mutual contact, mock data, cancellation windows, and reputation visibility.
- Scope control: The plan does not add platform payments, user-created activities, public community feeds, memberships, or a backend.
- Type consistency: The same names are used across tasks: `JuZhangAssignment`, `TopicCard`, `Settlement`, `willingToBeJuZhang`, `getSettlementSummary`, and `getParticipantPreview`.
- Verification: Every implementation task includes at least one test or build command before commit.
