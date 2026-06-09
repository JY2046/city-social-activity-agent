# WeChat Mini Program Capabilities

This document explains how the MVP should use WeChat-native capabilities. Final implementation details must be checked against the Mini Program admin console and current official documentation before release.

Official documentation entry points:

- Mini Program framework: https://developers.weixin.qq.com/miniprogram/dev/framework/
- Login: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- Subscription messages: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
- Cloud Development: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/basis/getting-started.html
- Security guidance: https://developers.weixin.qq.com/miniprogram/dev/framework/security.html

## Login

The Mini Program should use WeChat login to create or restore the platform user identity.

Client flow:

1. Call `wx.login`.
2. Receive a temporary login `code`.
3. Send the `code` to a cloud function such as `loginOrCreateUser`.
4. The cloud function resolves `openid`, creates or loads `users`, and returns a server-issued session.
5. The client stores only the app session token and public profile fields needed for UI.

Implementation wrapper:

- `apps/miniprogram/src/services/authService.ts`
- `loginWithWeChat(adapter)` wraps `wx.login` and a backend code exchange.
- The adapter shape keeps tests independent from the real `wx` global.

Server responsibilities:

- Never expose `openid` in user-facing UI.
- Normalize or review nickname and avatar before public display.
- Store activity history visibility preference separately from raw attendance data.
- Keep raw trust scoring internal.

## Subscription Messages

Subscription messages should be requested only at meaningful user actions, not as a blanket prompt.

Request points:

| Product point | Template purpose |
| --- | --- |
| `signup` | Activity reminders, especially 24 hours and 30 minutes before start. |
| `waitlist` | Waitlist promotion or queue status changes. |
| `juZhang` | JuZhang invitation, acceptance, replacement, and task reminders. |
| `feedback` | Post-event feedback and mutual-selection reminder. |

Implementation wrapper:

- `apps/miniprogram/src/services/notificationService.ts`
- `requestSubscriptionForPoint(point, adapter)` maps product points to template ids.
- Template ids are placeholders in code and must be replaced by real template ids from the Mini Program admin console.

Recommended request timing:

- After successful signup, request activity reminder permission.
- After joining activity waitlist, request waitlist promotion permission.
- After accepting or joining JuZhang candidate flow, request JuZhang task reminder permission.
- After activity completion, request feedback completion reminder permission.

## Privacy Prompts

Required user-facing explanations:

- WeChat login is used to create a platform account and prevent duplicate participation.
- Activity history count can be shown or hidden by the user.
- No private contact information is opened before an activity.
- Contact opens only after post-event mutual selection.
- Abnormal feedback is used for safety and operations review.
- Uploaded profile or activity content may be reviewed before public display.

## Content Safety

Text and image review should cover:

- Activity titles and descriptions.
- Venue claims and public photos.
- Nicknames, avatars, and bios.
- Post-event abnormal feedback.
- Future user-uploaded activity photos.

Rejected content should not be displayed. Every moderation action should create an `adminActions` entry.

## Data Permissions

Minimum required data for v1:

- WeChat identity through `openid` resolved server-side.
- Nickname and avatar only after user consent or platform-safe default.
- City and interests for recommendation and topic cards.
- Registration, waitlist, arrival, settlement, and feedback state.

Avoid in v1:

- Real-time location tracking.
- Phone number collection.
- Contact list access.
- Platform-held payments.
- Full in-app chat.

## Payment

Payment remains deferred for v1.

- Paid activities use offline AA or pay-to-merchant.
- The system records expected spend and confirmation state.
- Ordinary participants confirm their own payment.
- JuZhang confirms participant payment state.
- WeChat Pay is a later phase only if deposits, tickets, platform service fees, refunds, or disputes become necessary.
