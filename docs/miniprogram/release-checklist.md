# Mini Program Release Checklist

This checklist is for the first cold-start release. Platform rules can change, so the final go/no-go must be checked in the WeChat Mini Program admin console and current official documentation before submission.

Official documentation entry points:

- Mini Program framework: https://developers.weixin.qq.com/miniprogram/dev/framework/
- Login: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- Subscription messages: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
- Cloud Development: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/basis/getting-started.html
- Security guidance: https://developers.weixin.qq.com/miniprogram/dev/framework/security.html

## Account And Category

- [ ] Register or confirm Mini Program account ownership.
- [ ] Confirm product category is acceptable for offline city social activities.
- [ ] Confirm whether any special qualification is needed for social, offline events, food, alcohol-adjacent, or matchmaking-like wording.
- [ ] Avoid launch copy that implies dating, financial custody, alcohol encouragement, or guaranteed safety.
- [ ] Configure production AppID in `project.config.json` before release.

## Privacy And User Consent

- [ ] Publish privacy policy.
- [ ] Explain WeChat login usage.
- [ ] Explain profile data usage: nickname, avatar, city, interests, activity history visibility.
- [ ] Explain location/address usage, if precise location is introduced.
- [ ] Explain post-event feedback and mutual selection.
- [ ] Explain that raw trust scores are not shown publicly.
- [ ] Provide account deletion or data removal contact/process.

## Safety And Trust

- [ ] Keep activity contact rule visible: no contact before activity, mutual selection after activity.
- [ ] Add abnormal feedback entry after each activity.
- [ ] Add manual admin ability to remove activities, registrations, users, photos, and feedback.
- [ ] Add warning copy for night activities, alcohol-related venues, and offline meetup safety.
- [ ] Confirm JuZhang role boundary: coordination only, not legal, financial, or safety guarantee.
- [ ] Confirm ordinary participant 12-hour and JuZhang 24-hour cancellation rules are visible.

## Content Review

- [ ] Review activity titles, descriptions, venue claims, and public photos before publishing.
- [ ] Review user nicknames, avatars, bios, abnormal feedback, and uploaded photos before display.
- [ ] Add text safety review before storing or showing user-generated content.
- [ ] Add image safety review before showing uploaded images.
- [ ] Store moderation results and admin action logs.

## Activity Operations

- [ ] Seed first Shanghai activities manually.
- [ ] Keep activity creation internal for v1.
- [ ] Confirm each activity has title, venue, public photos, attraction summary, highlights, location guide, cost, capacity, and rules.
- [ ] Confirm each paid activity has settlement mode: self-pay to merchant or JuZhang collects.
- [ ] Confirm free activities skip settlement money work.
- [ ] Confirm full activities route to waitlist.
- [ ] Confirm activities with existing JuZhang route new candidates to JuZhang waitlist.

## Cloud Development

- [ ] Create production cloud environment.
- [ ] Create collections: `users`, `activities`, `registrations`, `waitlists`, `juZhangAssignments`, `settlements`, `topicCards`, `feedback`, `adminActions`.
- [ ] Configure indexes listed in `cloud-data-model.md`.
- [ ] Lock client writes for core collections.
- [ ] Deploy cloud functions listed in `cloud-functions.md`.
- [ ] Add transaction protection for signup, cancellation, waitlist promotion, and settlement.
- [ ] Add logs and alarms for failed signups, failed cloud functions, and content review failures.

## Subscription Messages

- [ ] Define message templates for signup success.
- [ ] Define waitlist promotion reminder.
- [ ] Define JuZhang invitation reminder.
- [ ] Define 24-hour and 30-minute activity reminders.
- [ ] Define settlement confirmation reminder.
- [ ] Define feedback completion reminder.
- [ ] Request subscription permission only at relevant user actions.

## Payment Deferral

- [ ] Do not collect platform funds in v1.
- [ ] Do not enable deposits, tickets, service fees, refunds, or disputes until payment scope is approved.
- [ ] If WeChat Pay is added later, prepare merchant account, refund rules, dispute handling, invoice/tax handling if applicable, and payment compliance review.

## QA Before Submission

- [ ] Test in WeChat Developer Tools.
- [ ] Test on at least one iOS WeChat device.
- [ ] Test on at least one Android WeChat device.
- [ ] Test first-time login.
- [ ] Test discover to detail to signup.
- [ ] Test signup without JuZhang opt-in.
- [ ] Test signup with JuZhang opt-in.
- [ ] Test full activity waitlist.
- [ ] Test JuZhang waitlist.
- [ ] Test arrival sync.
- [ ] Test ordinary participant payment confirmation.
- [ ] Test JuZhang arrival check and AA confirmation.
- [ ] Test feedback, abnormal report, and mutual selection.
- [ ] Test free activity with no settlement money work.

## Launch Guardrails

- [ ] Launch one city first: Shanghai.
- [ ] Start with dinner, coffee, and free walk activities.
- [ ] Delay bar/night activities until moderation and safety process is reliable.
- [ ] Keep user-created activities off until trust and review tooling is stable.
- [ ] Review all reports daily during the first launch period.
