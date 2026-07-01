# Home And JuZhang High-Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home discovery screen and accepted JuZhang task screen so the mobile prototype closely matches the two user-confirmed visual references.

**Architecture:** Keep the existing Vite React app, mock data, navigation flow, and test contracts. Change only the two in-scope components and shared CSS needed to match the visual hierarchy, density, asset placement, and mobile chrome of the confirmed images.

**Tech Stack:** React 19, TypeScript, Vite, lucide-react icons, CSS modules through the existing global `src/styles.css`, bitmap assets in `public/images`.

---

## File Structure

- Modify `src/App.tsx`: keep the home header and tabbar, but hide the default app chrome for the JuZhang screen.
- Modify `src/components/ActivityHome.tsx`: preserve activity data fields while tightening the home feed order, featured-card CTA, AI strip, and platform cue row.
- Modify `src/components/JuZhangPanel.tsx`: preserve JuZhang accept/decline logic while rendering the accepted state as the dark task workspace shown in the reference.
- Modify `src/styles.css`: implement the mobile high-fidelity layout, shadows, radii, typography, dark JuZhang shell, and fixed bottom actions.
- Modify `design-qa.md`: record the final side-by-side visual QA and remaining low-priority polish notes.

### Task 1: Home Screen Structure

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ActivityHome.tsx`

- [ ] **Step 1: Preserve current tests before visual work**

Run:

```bash
npm test
```

Expected: existing tests pass or failures are documented before edits.

- [ ] **Step 2: Match reference information order**

In `src/App.tsx`, keep the location/date/profile header visible only for home and other light screens, with `上海`, `6月5日 周四 18:40`, and the `L` profile badge matching the screenshot.

In `src/components/ActivityHome.tsx`, keep the visible feed order:

```ts
const displayActivities = [
  activities[0],
  ...activities.slice(1).sort((left, right) => {
    const order = { coffee: 1, walk: 2, bar: 3, dinner: 4 };
    return order[left.type] - order[right.type];
  }),
].filter(Boolean);
```

- [ ] **Step 3: Keep accessible button labels stable**

The compact card button can be icon-only visually, but it must keep names such as `查看 周末咖啡聊天局` so `src/App.test.tsx` continues to locate it.

### Task 2: Home Screen Visual CSS

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Set the mobile canvas**

Use a warm off-white app shell with max width around `430px`, no desktop dashboard sections, and a `390 x 844` primary QA viewport.

- [ ] **Step 2: Match hero and search density**

Tune `.app-topbar`, `.hero-band`, `.city-visual`, `.search-panel`, and `.filter-strip` so the skyline, headline, search field, and chips occupy the same first-screen rhythm as the reference.

- [ ] **Step 3: Match activity cards**

Tune `.activity-card.featured`, `.featured-overlay`, `.ai-note`, `.leader-pill`, compact card grids, thumbnails, status pills, and the circular CTA so the sushi, coffee, and free-walk cards resemble the confirmed home screenshot.

### Task 3: JuZhang Screen Structure

**Files:**
- Modify: `src/components/JuZhangPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Keep pre-accept state functional**

Keep the `接受局长` and `拒绝，不影响参加` buttons available before acceptance, with refusal returning to itinerary.

- [ ] **Step 2: Match accepted state order**

After acceptance, render:

```text
hero -> AI reminder -> accepted banner -> task grid -> AI topic card -> AA settlement -> mutual selection -> fixed bottom actions
```

- [ ] **Step 3: Preserve settlement logic**

Paid activities show `settlementSummary.label` and unpaid count. Free activities show `本活动无需确认支付状态。`.

### Task 4: JuZhang Screen Visual CSS

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Hide default chrome**

For `.screen-juZhang`, hide `.app-topbar`, `.hero-band`, and `.app-tabbar`; use the JuZhang hero controls and bottom action bar instead.

- [ ] **Step 2: Build the dark visual hierarchy**

Tune `.ju-hero`, `.ju-ai-reminder`, `.ju-accepted-card`, `.ju-task-grid`, `.ju-topic-card`, `.ju-settlement-card`, `.ju-mutual-card`, and `.ju-bottom-actions` to match the dark lantern reference.

### Task 5: Visual QA And Verification

**Files:**
- Modify: `design-qa.md`

- [ ] **Step 1: Capture home at mobile size**

Run the local app and capture the home screen at `390 x 844`.

- [ ] **Step 2: Capture accepted JuZhang at mobile size**

Navigate through signup, accept JuZhang, and capture the screen at `390 x 844`.

- [ ] **Step 3: Compare against references**

Update `design-qa.md` with whether home and JuZhang pass against the two confirmed source images.

- [ ] **Step 4: Run automated verification**

Run:

```bash
npm test
GITHUB_PAGES=true npm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit and push**

Commit the scoped files and push the current branch to GitHub Pages after verification passes.
