# Mini Program Cold Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a WeChat Mini Program MVP foundation for the city social activity product while preserving the existing React Web prototype as a reference.

**Architecture:** Add a separate Taro + React + TypeScript Mini Program app under `apps/miniprogram`, with shared domain types extracted into `packages/domain`. The first implementation uses local mock adapters, then adds cloud adapters and deployment configuration in later tasks.

**Tech Stack:** Taro, React, TypeScript, WeChat Mini Program, optional WeChat Cloud Development/Tencent Cloud, Vitest or Taro-compatible unit tests.

---

## File Structure

- Create `apps/miniprogram/`: Taro Mini Program application.
- Create `packages/domain/`: shared TypeScript domain models and pure rules.
- Keep existing `src/`: current Web prototype remains deployable and untouched except for importing shared types if a later refactor chooses to do so.
- Create `docs/miniprogram/`: release checklist, platform capability checklist, and product operation notes.

## Task 1: Repository Structure And Tooling

**Files:**

- Create: `apps/miniprogram/package.json`
- Create: `apps/miniprogram/project.config.json`
- Create: `apps/miniprogram/config/index.ts`
- Create: `apps/miniprogram/src/app.config.ts`
- Create: `apps/miniprogram/src/app.tsx`
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/index.ts`

- [x] **Step 1: Add Mini Program workspace package**

Add an isolated Taro app package so the Web prototype remains stable while Mini Program work begins.

- [x] **Step 2: Add shared domain package**

Move reusable activity, registration, JuZhang, settlement, and feedback types into `packages/domain/src/index.ts`.

- [x] **Step 3: Verify install/build path**

Run:

```bash
npm install
npm --workspace apps/miniprogram run build:weapp
```

Expected: Mini Program build succeeds or fails only because Taro dependencies are not installed yet.

Completed on 2026-06-09:

- `npm install`
- `npm --workspace @city-social/domain run build`
- `npm --workspace apps/miniprogram run build:weapp`

## Task 2: Page Shell And Navigation

**Files:**

- Create: `apps/miniprogram/src/pages/discover/index.tsx`
- Create: `apps/miniprogram/src/pages/activity-detail/index.tsx`
- Create: `apps/miniprogram/src/pages/signup/index.tsx`
- Create: `apps/miniprogram/src/pages/itinerary/index.tsx`
- Create: `apps/miniprogram/src/pages/juzhang/index.tsx`
- Create: `apps/miniprogram/src/pages/waitlist/index.tsx`
- Create: `apps/miniprogram/src/pages/feedback/index.tsx`
- Create: `apps/miniprogram/src/pages/profile/index.tsx`

- [x] **Step 1: Register Mini Program pages**

Configure all MVP pages in `app.config.ts`.

- [x] **Step 2: Implement static page shells**

Each page renders a title and a minimal empty state matching the product flow.

- [x] **Step 3: Build**

Run:

```bash
npm --workspace apps/miniprogram run build:weapp
```

Expected: all pages compile.

Completed on 2026-06-09:

- `npm --workspace apps/miniprogram run build:weapp`

## Task 3: Mock Data Adapter

**Files:**

- Create: `apps/miniprogram/src/services/activityService.ts`
- Create: `apps/miniprogram/src/services/mockData.ts`
- Create: `apps/miniprogram/src/services/registrationService.ts`

- [x] **Step 1: Add activity mock data**

Copy the current curated activities into a Mini Program service shape with local image paths.

- [x] **Step 2: Add service functions**

Expose:

```ts
listActivities()
getActivity(activityId)
signup(activityId, options)
joinWaitlist(activityId, type)
confirmArrival(activityId, arrivalStatus)
confirmPayment(activityId)
```

- [x] **Step 3: Add unit tests**

Verify waitlist, signup, and payment status transitions with pure service tests.

Completed on 2026-06-09:

- `npm test -- apps/miniprogram/src/services/registrationService.test.ts`

## Task 4: Discover And Detail Pages

**Files:**

- Modify: `apps/miniprogram/src/pages/discover/index.tsx`
- Modify: `apps/miniprogram/src/pages/activity-detail/index.tsx`
- Create: `apps/miniprogram/src/components/ActivityCard.tsx`
- Create: `apps/miniprogram/src/components/DetailGallery.tsx`

- [x] **Step 1: Build activity feed**

Render curated activity cards with title, image, type, status, time, cost, and CTA.

- [x] **Step 2: Build activity detail**

Render title card, public photos below title, `种草理由`, highlights, compact participant preview, rules, and signup/waitlist CTA.

- [x] **Step 3: Add share metadata**

Configure activity detail to support WeChat share path with `activityId`.

Completed on 2026-06-09:

- `npm test -- apps/miniprogram/src/services/activityPresentation.test.ts`
- `npm --workspace apps/miniprogram run build:weapp`

## Task 5: Signup, Itinerary, Waitlist

**Files:**

- Modify: `apps/miniprogram/src/pages/signup/index.tsx`
- Modify: `apps/miniprogram/src/pages/itinerary/index.tsx`
- Modify: `apps/miniprogram/src/pages/waitlist/index.tsx`

- [x] **Step 1: Signup confirmation**

Render rules confirmation and optional JuZhang willingness.

- [x] **Step 2: Itinerary operations**

Render arrival sync buttons, JuZhang application, settlement confirmation, and return-to-detail.

- [x] **Step 3: Waitlist states**

Render activity waitlist and JuZhang waitlist states.

Completed on 2026-06-09:

- `npm test -- apps/miniprogram/src/services/flowViewModels.test.ts`
- `npm --workspace apps/miniprogram run build:weapp`

## Task 6: JuZhang And Feedback

**Files:**

- Modify: `apps/miniprogram/src/pages/juzhang/index.tsx`
- Modify: `apps/miniprogram/src/pages/feedback/index.tsx`

- [x] **Step 1: JuZhang workspace**

Render accept/decline, arrival check, AI topic card, coordination checklist, AA confirmation, and post-event feedback entry.

- [x] **Step 2: Feedback and mutual selection**

Render participant mutual selection, abnormal feedback, and completion state.

Completed on 2026-06-09:

- `npm test -- apps/miniprogram/src/services/juZhangService.test.ts apps/miniprogram/src/services/feedbackService.test.ts`
- `npm --workspace apps/miniprogram run build:weapp`

## Task 7: Cloud Adapter Design

**Files:**

- Create: `docs/miniprogram/cloud-data-model.md`
- Create: `docs/miniprogram/cloud-functions.md`
- Create: `docs/miniprogram/release-checklist.md`

- [ ] **Step 1: Define collections**

Document `users`, `activities`, `registrations`, `waitlists`, `juZhangAssignments`, `settlements`, `topicCards`, `feedback`, and `adminActions`.

- [ ] **Step 2: Define cloud functions**

Document signup, cancellation, waitlist promotion, JuZhang selection, settlement confirmation, feedback, and content safety functions.

- [ ] **Step 3: Define release checklist**

Include account registration, category verification, privacy policy, content safety, image upload review, subscription messages, and payment deferral.

## Task 8: WeChat Capability Integration

**Files:**

- Modify: `apps/miniprogram/src/services/authService.ts`
- Modify: `apps/miniprogram/src/services/notificationService.ts`
- Create: `docs/miniprogram/wechat-capabilities.md`

- [ ] **Step 1: Login integration**

Add WeChat login wrapper and store server-issued user identity.

- [ ] **Step 2: Subscription message request points**

Request subscription messages after signup, waitlist join, JuZhang acceptance, and feedback completion when appropriate.

- [ ] **Step 3: Safety and privacy notes**

Document data permissions and privacy prompts needed before release.

## Task 9: First Release QA

**Files:**

- Create: `docs/miniprogram/qa-script.md`

- [ ] **Step 1: Add QA script**

Cover discover, detail, signup, itinerary, JuZhang, waitlist, feedback, and profile.

- [ ] **Step 2: Device testing**

Test in WeChat Developer Tools and at least one iOS and one Android WeChat device.

- [ ] **Step 3: Release candidate**

Submit trial version for internal testing before public release.

## Execution Notes

- Do not connect payment in the first implementation unless the product owner explicitly changes scope.
- Do not add full chat in the first implementation.
- Keep activity creation internal until moderation and trust tools are ready.
- Treat uploaded photos and user text as untrusted content requiring review.
