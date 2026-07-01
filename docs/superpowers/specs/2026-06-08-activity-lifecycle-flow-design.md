# Activity Lifecycle Flow Design

## Goal

Turn the prototype from a visual activity feed into a coherent activity lifecycle product. The app must support how a real city social activity moves from discovery, to signup, to pre-event coordination, to in-event settlement, to post-event feedback and mutual opt-in.

## Source Context

This design extends the visual direction in `docs/superpowers/specs/2026-06-07-high-fidelity-design-implementation.md`.

The user identified the following gaps on 2026-06-08:

- The `饭局` tag no longer overlaps with `已成局`, but its position still feels wrong.
- The platform cue row (`活动前不开放`, `活动后互选`, `局长协助`) should not float in the middle of activity cards.
- The activity detail back button should say `返回活动首页`.
- The prototype-only `模拟活动结束` button does not match a real activity flow.
- The itinerary screen needs entry points for applying to be JuZhang and for queueing when a JuZhang or activity slot is unavailable.
- The itinerary screen needs a way back to activity detail.
- The JuZhang screen has slight overlap between the AI reminder and hero copy.
- Ordinary participants need in-event settlement confirmation.
- JuZhang needs in-event execution tools: arrival check, coordination, settlement confirmation, and post-event feedback.

## Non-Goals

- Do not add real backend, authentication, payment provider integration, push notifications, or messaging.
- Do not build a complete production queue system; represent queueing as local prototype state and clear UI copy.
- Do not replace the confirmed home/JuZhang visual language. Adjust layout only where usability and lifecycle clarity require it.

## Recommended Information Architecture

### Home Discovery

Keep the current home hierarchy, with two refinements:

1. The featured-card `饭局` tag belongs near the title metadata area, not in the same layer as the status badge.
2. The platform cue row should sit after the featured activity and before the secondary activity list.

Rationale:

- Putting cues before any activity makes the product feel explanatory instead of social.
- Putting cues at the bottom makes them easy to miss and can conflict with the tabbar.
- Putting cues after the featured card lets the user first see a concrete activity, then understand the product rules before browsing more.

### Activity Detail

The detail page should act as the user's decision page.

Required behavior:

- Back button text: `返回活动首页`.
- Primary CTA depends on activity state:
  - If the activity still has capacity: `报名并确认规则`.
  - If the activity is full or at capacity: `加入候补排队`.
- Remove the prototype-only `模拟活动结束` concept from detail and itinerary as a primary user action.
- After signup, route to the itinerary screen.

The detail page can continue to show rules and participant preview.

### Itinerary Screen

The itinerary screen is the normal participant's activity operations page. It must work for both ordinary participants and JuZhang candidates.

Required sections:

1. Return action: `返回活动详情`.
2. Activity summary: time, venue, headcount/status.
3. Arrival status sync:
   - `我会准时到`
   - `可能迟到`
   - `稍后确认`
4. JuZhang application state:
   - If the user did not opt in and no JuZhang queue action has been taken: show `申请成为局长`.
   - If the activity already has a JuZhang or the user has applied after signup: show `局长候补排队中`.
   - If the user opted in during signup: show `查看局长任务`.
5. Participant settlement state:
   - For paid activities: show `查看费用明细`, `确认我已支付`, and a status line that JuZhang will confirm everyone has completed payment.
   - For free activities: show a free-state note and do not show paid settlement confirmation.
6. Activity completion:
   - Replace `模拟活动结束` with `填写活动反馈`.
   - This button leads to the existing feedback and mutual opt-in page.

### Queueing

Represent two queue types in the prototype:

1. Activity waitlist:
   - Triggered when an activity is at or above capacity.
   - CTA: `加入候补排队`.
   - Result state: `候补排队中`.
2. JuZhang waitlist:
   - Triggered when a user applies to be JuZhang after signup while a JuZhang already exists, or when they opted in but are not the active JuZhang.
   - CTA/state: `局长候补排队中`.

Queueing does not need backend persistence in this prototype. It only needs local state and clear visible copy.

### JuZhang Screen

The JuZhang screen should become an execution workspace, not only a task display.

Required sections:

1. Hero and metadata:
   - Keep dark restaurant hero.
   - Move the AI reminder below the hero with enough margin so it cannot overlap hero copy.
2. Arrival check:
   - Show participant arrival status counts.
   - Show rows for `已到`, `迟到`, and `未确认`.
   - Include an action label such as `核准到场`.
3. In-event coordination:
   - Keep the three task cards.
   - Keep AI topic card.
   - Add a short coordination checklist for the JuZhang.
4. Settlement confirmation:
   - For paid activities: show total/per-person amount, participant payment states, and a JuZhang confirmation action.
   - For free activities: show `本活动无需 AA 结算`.
5. Post-event:
   - Show `填写局长反馈`.
   - Show `开启活动后互选`.
   - Route final feedback to the existing feedback panel.

### Ordinary Participant Settlement

Ordinary participants need visibility into settlement without having JuZhang authority.

Required behavior:

- Show the estimated or calculated per-person amount.
- Show a `确认我已支付` button for paid activities.
- After confirmation, show `已提交支付确认，等待局长核对`.
- JuZhang remains the only role that confirms everyone has completed payment.

## Screen-Level Acceptance Criteria

### Home

- `饭局` tag does not overlap `已成局`.
- The platform cue row appears after the featured card and before secondary cards.
- Search, filter, card CTA, AI text, and bottom nav fit on common mobile widths such as `375 x 812`.

### Detail

- Back button says `返回活动首页`.
- No visible `模拟活动结束` button.
- Full activities expose waitlist CTA instead of normal signup.

### Itinerary

- Has `返回活动详情`.
- Has arrival status sync.
- Has ordinary participant settlement controls for paid activities.
- Does not show `查看局长任务` unless the user opted in or applied for JuZhang.
- Shows JuZhang waitlist state when appropriate.
- Uses `填写活动反馈` instead of `模拟活动结束`.

### JuZhang

- AI reminder does not overlap hero text.
- Page is scrollable.
- Arrival check, coordination, settlement confirmation, and post-event feedback are visible sections.
- Settlement cards do not cover topic cards, mutual cards, or bottom actions.

## Testing Requirements

Add tests for:

- Detail back button text is `返回活动首页`.
- Full activity detail shows `加入候补排队`.
- Itinerary shows `返回活动详情`.
- Itinerary does not show `查看局长任务` unless the user opted in.
- Itinerary shows ordinary participant paid settlement controls.
- JuZhang page shows arrival check, settlement confirmation, and feedback entry.

## Visual QA Requirements

Before handoff:

1. Capture home at `375 x 812`.
2. Capture detail at `375 x 812`.
3. Capture ordinary participant itinerary at `375 x 812`.
4. Capture JuZhang accepted page at `375 x 812`, including a scrolled lower section.
5. Run `npm test`.
6. Run `GITHUB_PAGES=true npm run build`.
