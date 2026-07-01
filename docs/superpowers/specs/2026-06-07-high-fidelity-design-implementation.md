# High-Fidelity Design Implementation Spec

## Goal

Make the prototype look like the selected design mockups, not merely inspired by them.

The user explicitly confirmed on 2026-06-07 that the two supplied screenshots are the intended home and JuZhang designs. The implementation must treat these two images as the visual source of truth, not as loose inspiration:

- Home / discovery source: `/Users/lily/.codex/generated_images/019e91b4-95ca-7a81-b267-a2f0dfef33fc/ig_09f7a6d86af070f2016a2235d228648195b351c711a2aed3fc.png`
- JuZhang source: `/Users/lily/.codex/generated_images/019e91b4-95ca-7a81-b267-a2f0dfef33fc/ig_09f7a6d86af070f2016a223670d3748195ad58821ba5dadf8f.png`

## Non-Goals

- Do not redesign the product direction.
- Do not invent a new landing page.
- Do not replace the existing activity/signup/itinerary/feedback business flow.
- Do not add backend, auth, chat, payments, or real settlement integrations.

## Target Viewport

- Primary target: `390 x 844`.
- The source images are `853 x 1844`; use width scaling as the comparison baseline.
- Every QA screenshot must compare the same state at `390 x 844`.

## Product Scope

Only two visual surfaces are in scope for this pass:

1. Home discovery feed, matching the supplied light Shanghai skyline screenshot.
2. Accepted JuZhang task workspace, matching the supplied dark restaurant/lantern screenshot.

Other screens may keep the current product style unless they block navigation to these two surfaces.

## Home Screen Design Requirements

### Composition

The first viewport must communicate the same hierarchy as the source:

1. Top location/date row.
2. Profile avatar.
3. Skyline-backed brand area.
4. Large headline `先活动，后关系` with green/red emphasis.
5. Search input and filter button.
6. Horizontal category chips.
7. Featured sushi activity card.
8. Compact coffee card.
9. Compact free-walk card.
10. Platform cue row.
11. Bottom tabbar.

The first viewport should not feel like a stacked web dashboard. It must feel like a dense mobile social app.

### Featured Card

The featured card must be image-led:

- Image card with dark overlay.
- Top-left formed/status badge.
- Top-right headcount badge.
- Category pill inside image.
- Title, venue, date/time, cost overlaid on image.
- Red CTA pill inside the image area.
- AI recommendation strip below the image.

The CTA must not push the card height down. It belongs to the image overlay.

### Compact Cards

Compact cards must:

- Use a left thumbnail.
- Keep type/status/headcount visible but small.
- Keep title and metadata in a tight right column.
- Keep AI recommendation to a single compact strip.
- Use a circular red affordance on the right.

The home feed order must match the source: sushi, coffee, free walk, platform cue row. The bar activity can appear below the first viewport.

### Platform Cue Row

The cue row must preserve these three ideas:

- 活动前不开放联系方式
- 活动后互选
- 局长协同流程 & AA 确认

It should sit visually above the bottom navigation in the home feed, not be buried after every activity card.

### Assets

Use real bitmap assets, not CSS art.

Required assets:

- `public/images/city-skyline.jpg`
- `public/images/activity-sushi.jpg`
- `public/images/activity-coffee.jpg`
- `public/images/activity-walk.jpg`

Do not crop UI text from a source mock into an image asset. If a clean source layer is unavailable, crop an image-only region or use a generated clean asset that matches the source direction.

## JuZhang Screen Design Requirements

### Composition

The JuZhang accepted state must be a full dark activity/task workspace, not a light app shell with dark cards.

Required order:

1. Dark venue hero with back/share/more controls.
2. Activity type pill.
3. Activity title.
4. Venue, time, headcount/status, cost/free state.
5. AI reminder bar.
6. Accepted JuZhang status banner.
7. JuZhang task grid with three task tiles.
8. AI topic card with city-night visual.
9. AA settlement flow.
10. Mutual-selection card.
11. Bottom action bar.

### Navigation Chrome

The default light topbar and bottom tabbar must be hidden in the JuZhang screen. The JuZhang source uses its own dark hero controls and bottom action bar.

### Task Grid

Use three visible task tiles:

- 开场 & 破冰
- 活动中协调
- AA 结算确认

The cards must use dark translucent panels, green accent icons, and compact copy.

### AI Topic Card

The AI topic card must be purple/dark and visual, not a plain text card.

It must display the selected `topicCard.visibleText` from current mock data.

### AA Settlement

The AA section must preserve current business logic:

- Paid activities show `settlementSummary.label`.
- Free activities show `本活动无需确认支付状态。`.
- Paid activities show unpaid count.

## Visual Tokens

### Home

- Background: warm off-white.
- Primary green: deep city green.
- Action red: tomato/coral red.
- Radius: large but controlled, closer to native mobile than web cards.
- Shadows: soft and light.

### JuZhang

- Background: near-black.
- Panels: translucent dark cards.
- Accent green: task/status highlights.
- Topic accent: purple.
- Settlement accent: warm gold/orange.
- Bottom CTA: red-to-orange gradient.

## Accessibility And Test Contracts

Existing user-flow tests must continue to pass.

Do not remove these accessible button names:

- `查看 周五下班日料小局`
- `查看 周末咖啡聊天局`
- `查看 免费城市散步局`
- `接受局长`
- `拒绝，不影响参加`
- `完成局长任务`

Visible text may differ from accessible labels when needed for visual fidelity.

## QA Requirements

Before handoff:

1. Capture home at `390 x 844`.
2. Capture JuZhang accepted state at `390 x 844`.
3. Create side-by-side comparisons with the two source mockups.
4. Update `design-qa.md`.
5. Run `npm test`.
6. Run `GITHUB_PAGES=true npm run build`.
7. Push the result and verify GitHub Pages points to the new asset hash.

## Acceptance Criteria

The work is acceptable only when:

- The first visual read of the home screen resembles the supplied light Shanghai skyline home screenshot.
- The first visual read of the JuZhang screen resembles the supplied dark restaurant/lantern JuZhang screenshot.
- Home no longer reads as a generic web dashboard.
- JuZhang no longer reads as a light shell with dark task cards.
- Tests and production build pass.
