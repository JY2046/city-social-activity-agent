# Mini Program Cold Start Design

## Goal

Launch the city social activity product as a WeChat Mini Program first, using the current Web prototype as the product reference and rebuilding the production MVP around WeChat-native sharing, signup, reminders, and lightweight trust mechanisms.

## Why Mini Program First

Mini Program is the right cold-start surface for this product because users can discover an activity, share it, register, receive reminders, and return to the itinerary without installing a separate app. It also fits the product's early growth loop: activity cards can be shared in WeChat chats, users can invite friends, and the platform can use WeChat identity, subscription messages, and later payment capabilities.

The current React Web prototype remains the design and interaction reference. It should not be treated as production code for Mini Program release.

## Recommended Technical Direction

Use **Taro + React + TypeScript** for the Mini Program client.

Reasons:

- The existing prototype is already React-based, so product thinking, component boundaries, and TypeScript models can be reused.
- Taro lets us build with React while targeting WeChat Mini Program.
- We can keep a shared domain layer for activity, registration, settlement, JuZhang, and feedback types.
- It is faster for this team than starting from native WXML/WXSS while still producing a true Mini Program.

Backend recommendation for the cold-start MVP:

- WeChat Cloud Development or Tencent Cloud for the first release.
- Cloud database for users, activities, registrations, waitlists, JuZhang assignments, settlement status, feedback, and mutual selections.
- Cloud storage for activity public photos and user-uploaded activity photos.
- Cloud functions for signup, cancellation, waitlist promotion, JuZhang selection, settlement confirmation, feedback, and content safety checks.

## First Release Scope

The first Mini Program release should include:

1. Discover
   - Mobile-first feed.
   - Activity cards with status, headcount, location, time, cost, and AI recommendation.
   - Shareable activity detail entry.

2. Activity Detail
   - Public photo gallery below the activity title card.
   - Activity title, time, location, headcount, and expected spend.
   - `种草理由` long-form AI summary.
   - Venue/activity highlights.
   - Compact participant preview.
   - Rules and signup or waitlist CTA.

3. Signup
   - Rules confirmation.
   - Optional JuZhang willingness.
   - No private contact info before the activity.

4. Itinerary
   - Activity time, place, status, and arrival sync.
   - Ordinary participant settlement confirmation for paid activities.
   - JuZhang application or queue state.
   - Return to activity detail.

5. JuZhang Workspace
   - Accept or decline without leaving the activity.
   - Arrival check.
   - AI topic card.
   - In-event coordination checklist.
   - AA settlement confirmation.
   - Post-event JuZhang feedback.

6. Waitlist
   - Full activity waitlist.
   - JuZhang waitlist.
   - Notification-ready state.

7. Feedback And Mutual Selection
   - Post-activity mutual selection.
   - Abnormal feedback.
   - Only mutual selections open contact.

8. My
   - Profile basics.
   - Activity history count with optional visibility.
   - Current itinerary.
   - Trust/level display without exposing raw scores.

## Explicitly Out Of Scope For Cold Start

- Full in-app chat.
- Public activity creation by every user.
- Complex recommendation engine.
- Platform-led payment collection.
- Real-time map tracking.
- Social feed unrelated to activities.
- Native iOS/Android apps.

## Payment Strategy

Cold start should keep payment simple:

- Paid activities use offline AA or pay-to-merchant flow.
- The system records expected spend and post-activity payment confirmation state.
- JuZhang confirms participant payment status.
- Do not collect platform funds in the first release unless there is a clear business reason.

Add WeChat Pay later if the product needs deposits, platform service fees, prepaid tickets, or refunds. That later phase requires merchant account setup, payment compliance, refund flow, and dispute handling.

## WeChat Platform Capabilities To Use

Use official WeChat capabilities as implementation references:

- Mini Program development framework: https://developers.weixin.qq.com/miniprogram/dev/framework/
- Login/open capability: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- Subscription messages: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
- Cloud Development: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/basis/getting-started.html
- Security guidance: https://developers.weixin.qq.com/miniprogram/dev/framework/security.html
- WeChat Pay, later phase only: https://pay.weixin.qq.com/doc/v3/merchant/4012062524

Before release, verify actual category, privacy, content safety, payment, and subscription-message requirements in the Mini Program admin console because platform requirements can change.

## Trust And Safety Requirements

This product organizes offline stranger activities, so safety is core product scope, not a later polish item.

Required for MVP:

- User identity through WeChat login.
- Activity contact rules: no contact before activity, mutual selection after activity.
- Report and abnormal feedback entry after every activity.
- Activity content review before publishing.
- Uploaded image safety checks.
- Manual admin ability to remove activities or participants.
- JuZhang responsibility boundary: coordination only, not legal or financial guarantee.
- Safety copy for alcohol, night activities, and offline meetups.
- Clear cancellation rules for ordinary participants and JuZhang.
- Minor protection policy: verify age before activity participation, require guardian consent if any low-risk minor flow is ever allowed, and prohibit minors from alcohol-related, late-night, or other restricted activities.
- PIPL-aligned data handling: collect only necessary profile, activity, feedback, and safety data; document account deletion and personal-data deletion timing; disclose cloud provider and third-party data sharing boundaries.
- Emergency response flow: provide an in-activity report path, define manual review SLA for threat/harassment/safety reports, publish an emergency platform contact, and document escalation to public-safety authorities for severe incidents.
- Subscription message privacy controls: limit reminder frequency, request permission only in relevant user actions, and provide a clear unsubscribe or opt-out path.

## Data Model

Core collections:

- `users`: profile, avatar, city, interests, visible activity count preference, trust level, status.
- `activities`: title, type, time, city, area, venue, address, photos, highlights, cost, capacity, status, rules.
- `registrations`: user, activity, status, willingToBeJuZhang, arrival status, timestamps.
- `waitlists`: activity, user, waitlist type, order, status.
- `juZhangAssignments`: activity, user, status, volunteered, selectedAt, declinedAt.
- `settlements`: activity, amount, per-person amount, free/paid type, participant payment states.
- `topicCards`: activity, generated text, seed profile summary, status.
- `feedback`: activity, user, selections, abnormal report, text, createdAt.
- `adminActions`: admin, target, action type, reason, createdAt.

## Mini Program Page Map

- `pages/discover/index`
- `pages/activity-detail/index`
- `pages/signup/index`
- `pages/itinerary/index`
- `pages/juzhang/index`
- `pages/waitlist/index`
- `pages/feedback/index`
- `pages/profile/index`
- `pages/admin/activity-review/index` for internal early ops if enabled

## Release Strategy

1. Internal prototype
   - Rebuild the current core flows in Taro with mock service adapters.
   - Use the Web prototype as visual reference.

2. Closed beta
   - Connect cloud database and cloud functions.
   - Seed a small number of curated activities.
   - Keep activity creation internal.

3. Cold-start public launch
   - Launch in one city, starting with curated low-risk activity types.
   - Recommended starting city: Shanghai, matching the current prototype.
   - Prioritize dinner, coffee, and free walk activities.
   - Delay bar/night activities unless safety and moderation are ready.

4. Iteration after real usage
   - Improve recommendation and topic cards.
   - Add payment only if operationally necessary.
   - Add user-created activities after trust and moderation rules are stable.

## Success Metrics

- Detail page to signup conversion.
- Signup to arrival confirmation rate.
- Activity completion rate.
- No-show rate.
- Post-activity feedback completion rate.
- Mutual selection rate.
- Report/abnormal feedback rate.
- JuZhang acceptance and completion rate.
- Share-to-signup conversion from WeChat.

## Open Decisions Before Implementation

- Whether the first backend uses WeChat Cloud Development or Tencent Cloud serverless with custom API.
- Whether the first release needs any deposit or platform collection.
- Which Mini Program category is acceptable for this product after admin-console verification.
- Whether activity photos are platform-curated only in v1 or user uploads are enabled from day one.
- Whether admin tools live inside the same Mini Program or as an internal web console.
