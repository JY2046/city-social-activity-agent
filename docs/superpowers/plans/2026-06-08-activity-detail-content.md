# Activity Detail Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photo gallery, AI attraction copy, venue credibility, dish/experience highlights, location, and spend content to the activity detail page.

**Architecture:** Extend the existing `Activity` mock data model and render the new fields inside `ActivityDetail`. Keep local-only prototype data and avoid third-party scraping or new routing.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, lucide-react, global CSS in `src/styles.css`.

---

## File Structure

- Modify `src/domain/types.ts`: add detail content field types to `Activity`.
- Modify `src/domain/mockData.ts`: add gallery, AI attraction summaries, proof points, highlights, and location guide for each mock activity.
- Modify `src/components/ActivityDetail.tsx`: render the new detail page structure.
- Modify `src/styles.css`: add compact mobile styles for gallery, facts, attraction card, proof chips, highlight cards, and CTA placement.
- Modify `src/App.test.tsx`: add detail content regression tests.

### Task 1: Detail Content Tests

- [x] **Step 1: Add failing tests**

Add tests that assert the sushi detail page shows:

```ts
expect(screen.getByText("场所公开图")).toBeInTheDocument();
expect(screen.getByText("AI 活动吸引点")).toBeInTheDocument();
expect(screen.getByText(/若竹日料在静安寺附近/)).toBeInTheDocument();
expect(screen.getByText("大众点评静安日料热门榜前列")).toBeInTheDocument();
expect(screen.getByText("招牌寿司拼盘")).toBeInTheDocument();
expect(screen.getByText("位置与消费")).toBeInTheDocument();
```

Add a coffee detail assertion:

```ts
expect(screen.getByText("梧桐边咖啡靠近武康路")).toBeInTheDocument();
expect(screen.getByText("手冲咖啡")).toBeInTheDocument();
```

- [x] **Step 2: Run red test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: fails because the fields and UI do not exist.

### Task 2: Data Model And Mock Data

- [x] **Step 1: Extend Activity type**

Add:

```ts
export interface ActivityGalleryItem {
  imageUrl: string;
  alt: string;
  sourceLabel: string;
}

export interface ActivityExperienceHighlight {
  title: string;
  description: string;
}
```

Add fields to `Activity`.

- [x] **Step 2: Add mock content**

Populate every activity with local image URLs, attraction prose, proof points, highlight cards, and location guide.

### Task 3: Detail UI

- [x] **Step 1: Render gallery**

Render a horizontal gallery with `img`, alt text, and source labels.

- [x] **Step 2: Render decision content**

Render AI attraction summary, proof points, highlights, and location/spend before rules.

- [x] **Step 3: Move rules lower**

Keep rules and CTA after participant preview.

### Task 4: Mobile Styling

- [x] **Step 1: Add detail content CSS**

Add gallery and content card styles sized for 390px mobile viewports.

- [x] **Step 2: Check CTA spacing**

Ensure the registration/waitlist CTA does not collide with the fixed bottom navigation.

### Task 5: Verification And Publish

- [x] **Step 1: Run tests**

Run:

```bash
npm test
```

- [x] **Step 2: Run build**

Run:

```bash
GITHUB_PAGES=true npm run build
```

- [x] **Step 3: Mobile browser QA**

Capture detail page screenshots at mobile width and check no text/button/photo overlap.

- [x] **Step 4: Commit and push**

Commit and deploy to GitHub Pages.
