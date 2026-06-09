# Mini Program Cloud Functions

This document defines the cloud function layer for the Mini Program MVP. Functions should be idempotent where possible and should enforce server-side validation even if the client already checks state.

## Shared Conventions

- Every function receives `openid` from WeChat context and resolves it to an internal `userId`.
- Every write includes `createdAt` or `updatedAt`.
- Every function returns a typed result with `ok`, `code`, `message`, and `data`.
- Every function writes an `adminActions` or operation log entry for high-risk state changes.
- Every function must reject blocked or limited users.

Client integration:

- Mini Program cloud wrappers live in `apps/miniprogram/src/services/cloudServices.ts`.
- Shared cloud response parsing lives in `apps/miniprogram/src/services/cloudFunctionClient.ts`.
- See `docs/miniprogram/cloud-adapter.md` for the build-time mock/cloud switch.

## Functions

### `loginOrCreateUser`

Purpose: resolve WeChat login identity into a platform user.

Input:

- WeChat cloud context `openid`.
- Optional profile fields after user consent.

Steps:

1. Find user by `openid`.
2. Create a new user if none exists.
3. Return public profile, trust level label, and feature flags.

Notes:

- Do not expose `openid` to client UI.
- Do not trust nickname/avatar until reviewed or normalized.

### `listActivities`

Purpose: return approved activity feed.

Input:

- `city`
- optional `type`, `keyword`, `budgetType`

Steps:

1. Query approved activities by city and future start time.
2. Attach cached participant count and status.
3. Return card-safe fields only.

### `getActivityDetail`

Purpose: return detailed activity content.

Input:

- `activityId`

Steps:

1. Verify activity is approved or user has access.
2. Return public photos, highlights, rules, and signup state.
3. Hide private contact information.

### `signupActivity`

Purpose: confirm a participant or put them into waitlist when full.

Input:

- `activityId`
- `willingToBeJuZhang`

Steps:

1. Validate user status.
2. Validate activity status and start time.
3. Check existing registration.
4. If activity is full, create `waitlists` entry with `type = activity` and registration `status = waitlisted`.
5. If available, create/update registration `status = confirmed`.
6. Increment activity participant count in the same transaction.
7. Add user to paid settlement state if needed.
8. If `willingToBeJuZhang`, create or update JuZhang candidate state.

Failure codes:

- `ACTIVITY_NOT_FOUND`
- `ACTIVITY_CLOSED`
- `ALREADY_REGISTERED`
- `USER_LIMITED`

### `cancelRegistration`

Purpose: cancel confirmed participation and apply internal rules.

Input:

- `activityId`
- optional `reason`

Steps:

1. Load registration and activity.
2. Determine whether the user is ordinary participant or accepted JuZhang.
3. Apply cancellation window:
   - participant: 12 hours.
   - JuZhang: 24 hours.
4. Update registration to `cancelled`.
5. Decrement participant count if confirmed.
6. If JuZhang cancelled, mark assignment `withdrawn` and call `selectJuZhangCandidate`.
7. Promote first waiting participant if capacity opens.

### `joinWaitlist`

Purpose: join activity or JuZhang queue.

Input:

- `activityId`
- `type`: `activity` or `juZhang`

Steps:

1. Validate user and activity.
2. Check existing queue entry.
3. Insert waiting entry with next order.
4. Return queue position.

### `promoteWaitlist`

Purpose: promote next waiting user when capacity opens.

Input:

- `activityId`
- `type`

Steps:

1. Find first `waiting` entry.
2. Mark it `promoted`.
3. If `activity`, create/update registration `confirmed`.
4. If `juZhang`, create/update assignment `invited`.
5. Trigger subscription message if permission exists.

### `selectJuZhangCandidate`

Purpose: choose or invite a JuZhang before activity.

Input:

- `activityId`
- optional `force`

Steps:

1. Check if activity already has accepted/active JuZhang.
2. Prefer users who volunteered.
3. Exclude users who cannot be JuZhang.
4. In cold start, allow default eligibility for new users unless limited.
5. Create assignment `invited`.
6. Send subscription message if available.

### `respondJuZhangAssignment`

Purpose: accept or decline JuZhang role without leaving the activity.

Input:

- `activityId`
- `response`: `accepted` or `declined`

Steps:

1. Validate assignment belongs to user.
2. Update assignment status.
3. If declined, keep registration unchanged.
4. If accepted, mark `acceptedAt`.
5. If declined, optionally select next candidate.

### `confirmArrival`

Purpose: participant arrival sync or JuZhang arrival check.

Input:

- `activityId`
- `userId` optional; omitted means current user.
- `status`: `confirmed`, `arrived`, `noShow`

Steps:

1. If acting for another user, require accepted/active JuZhang for this activity.
2. Update registration status and timestamp.
3. For `noShow`, mark internal scoring event.

### `createTopicCard`

Purpose: generate AI topic card.

Input:

- `activityId`

Steps:

1. Summarize participant age band, city area, occupations, and interests without exposing private details.
2. Generate one open-ended topic.
3. Store card as `generated`.
4. Optionally require admin review before showing.

### `confirmSettlement`

Purpose: record payment and AA confirmation.

Input:

- `activityId`
- `totalAmount` optional.
- `participantPaymentStates`
- `mode`: `selfPayToMerchant`, `juZhangCollects`, `free`

Steps:

1. Require accepted/active JuZhang for whole-list confirmation.
2. Allow ordinary participant to confirm only their own payment state.
3. If activity is free, keep settlement type `free` and skip money work.
4. Calculate per-person amount server-side.
5. Store payment state and confirmation timestamp.

### `submitFeedback`

Purpose: collect mutual selections and abnormal feedback.

Input:

- `activityId`
- `selectedUserIds`
- `abnormalText`
- optional `abnormalTags`

Steps:

1. Require completed or attended registration.
2. Store one feedback document per user per activity.
3. Run text safety review on abnormal feedback.
4. Compute mutual contact state only from both feedback documents.
5. Return completion state.

### `reviewContentSafety`

Purpose: central content and image safety review.

Input:

- `targetType`
- `targetId`
- `content`
- optional `fileId`

Steps:

1. Run text or image safety check.
2. Store review result.
3. Block display if rejected.
4. Create `adminActions` entry for review outcome.

## Transaction Boundaries

Use transactions for:

- signup count increment plus registration creation.
- cancellation plus waitlist promotion.
- JuZhang withdrawal plus replacement selection.
- settlement updates that affect multiple participants.

## Subscription Message Points

Request or send subscription messages after:

- signup success.
- waitlist join or promotion.
- JuZhang invitation and acceptance.
- activity reminder 24 hours and 30 minutes before start.
- settlement confirmation needed.
- feedback completion reminder.

## Deferred Payment Scope

Do not add platform collection in v1. Add WeChat Pay only when deposits, platform service fees, prepaid tickets, refunds, or dispute handling become product requirements.
