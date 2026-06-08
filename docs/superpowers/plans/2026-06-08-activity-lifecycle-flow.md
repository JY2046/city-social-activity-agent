# Activity Lifecycle Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the activity lifecycle flow from discovery through signup, queueing, in-event settlement, JuZhang execution, and post-event feedback.

**Architecture:** Keep the existing single-page React prototype and add stateful local-only flow screens. Activity detail, itinerary, waitlist, and JuZhang remain component-level screens controlled by `src/App.tsx`; no backend or persistence is introduced.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, lucide-react, global CSS in `src/styles.css`.

---

## File Structure

- Modify `src/App.tsx`: add waitlist state, route handlers for returning to detail, applying to JuZhang, queueing, payment confirmation, and feedback navigation.
- Modify `src/App.test.tsx`: add regression tests for detail CTAs, itinerary operations, waitlist, ordinary settlement, and JuZhang execution sections.
- Modify `src/components/ActivityHome.tsx`: move platform cues after the featured card and keep the featured `饭局` tag in the metadata layer.
- Modify `src/components/ActivityDetail.tsx`: rename back button, support normal signup versus waitlist CTA, and avoid prototype-only finish actions.
- Modify `src/components/Itinerary.tsx`: add return-to-detail, JuZhang application/queue state, ordinary settlement controls, and `填写活动反馈`.
- Create `src/components/WaitlistPanel.tsx`: show activity or JuZhang queue confirmation and a route back to detail/itinerary.
- Modify `src/components/JuZhangPanel.tsx`: add arrival check, coordination checklist, settlement confirmation, and JuZhang feedback entry.
- Modify `src/styles.css`: adjust home cue placement, featured tag position, itinerary operation cards, waitlist screen, and JuZhang execution layout.

### Task 1: Tests For Lifecycle Flow

**Files:**
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add failing tests**

Add tests that assert:

```ts
expect(screen.getByRole("button", { name: "返回活动首页" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "加入候补排队" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "返回活动详情" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "申请成为局长" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "确认我已支付" })).toBeInTheDocument();
expect(screen.getByText("到场核准")).toBeInTheDocument();
expect(screen.getByText("填写局长反馈")).toBeInTheDocument();
```

- [x] **Step 2: Run red test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: fails because the lifecycle controls are not implemented.

### Task 2: Detail And Waitlist

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ActivityDetail.tsx`
- Create: `src/components/WaitlistPanel.tsx`

- [x] **Step 1: Add waitlist screen state**

Add `waitlist` to the `Screen` union, a waitlist type state, and handlers for activity waitlist.

- [x] **Step 2: Update detail CTA**

Use `activity.currentParticipantCount >= activity.capacity` to show `加入候补排队`; otherwise show `报名并确认规则`.

- [x] **Step 3: Add waitlist panel**

Render `候补排队中` for full activities and provide back actions.

### Task 3: Itinerary Lifecycle Controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Itinerary.tsx`

- [x] **Step 1: Add itinerary props**

Add props for `onBackToDetail`, `onApplyJuZhang`, `juZhangQueueStatus`, `paymentConfirmed`, and `onConfirmPayment`.

- [x] **Step 2: Render controls**

Show `返回活动详情`, arrival sync, JuZhang application/queue state, paid settlement controls, and `填写活动反馈`.

- [x] **Step 3: Update tests**

Run `npm test -- src/App.test.tsx`; expected: detail and itinerary tests pass.

### Task 4: JuZhang Execution Workspace

**Files:**
- Modify: `src/components/JuZhangPanel.tsx`
- Modify: `src/styles.css`

- [x] **Step 1: Add execution sections**

Add `到场核准`, `活动中协调`, `AA 结算确认`, `填写局长反馈`, and `开启活动后互选`.

- [x] **Step 2: Fix hero/reminder spacing**

Ensure `.ju-ai-reminder` has positive margin below hero and never overlaps hero copy.

- [x] **Step 3: Run tests**

Run `npm test -- src/App.test.tsx`; expected: JuZhang lifecycle assertions pass.

### Task 5: Home Visual Placement

**Files:**
- Modify: `src/components/ActivityHome.tsx`
- Modify: `src/styles.css`

- [x] **Step 1: Move platform cues**

Render product cues after `index === 0`.

- [x] **Step 2: Adjust featured tag**

Place `饭局` near the title metadata layer, away from `已成局`.

### Task 6: Final Verification And Publish

**Files:**
- Modify: `design-qa.md`

- [x] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [x] **Step 2: Run production build**

Run:

```bash
GITHUB_PAGES=true npm run build
```

Expected: build exits 0.

- [x] **Step 3: Capture mobile QA**

Capture home, detail, itinerary, JuZhang top, and JuZhang scrolled at `375 x 812`.

- [ ] **Step 4: Commit and push**

Commit the plan and implementation, push to GitHub, and verify GitHub Pages uses the new asset hashes.
