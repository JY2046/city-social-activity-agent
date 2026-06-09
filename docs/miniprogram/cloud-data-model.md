# Mini Program Cloud Data Model

This document defines the first cloud data model for the WeChat Mini Program MVP. It mirrors the local mock services and is designed for WeChat Cloud Development or Tencent Cloud serverless.

## Principles

- Keep activity creation internal during cold start.
- Treat all user text and uploaded images as untrusted until reviewed.
- Store operational state explicitly instead of deriving it from chat messages.
- Do not store raw trust scores in public-facing documents.
- Keep payment as offline AA or pay-to-merchant confirmation for v1.

## Collections

### `users`

Stores the platform identity and public profile.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Internal user id. |
| `openid` | string | WeChat login identity. Do not expose to other users. |
| `unionid` | string | Optional, only if available and needed. |
| `nickname` | string | Display name after content review. |
| `avatarUrl` | string | Reviewed avatar URL or default avatar. |
| `city` | string | Default city, e.g. Shanghai. |
| `interests` | string[] | Used by topic-card generation and recommendation. |
| `bio` | string | Reviewed profile intro. |
| `reputationLevel` | string | Level label only, not raw score. |
| `attendedEventCount` | number | User may choose whether to show it. |
| `showAttendedEventCount` | boolean | Public visibility preference. |
| `canBeJuZhang` | boolean | False for users below internal trust threshold. |
| `status` | string | `active`, `limited`, `blocked`. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- Unique `openid`.
- `city`, `status`.

### `activities`

Stores curated activity supply.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Activity id. |
| `title` | string | Reviewed title. |
| `type` | string | `dinner`, `coffee`, `bar`, `walk`. |
| `city` / `area` | string | City and district/area. |
| `venue` | string | Venue display name. |
| `address` | string | Full address shown after signup if needed. |
| `startsAt` / `endsAt` | datetime | Activity time. |
| `budgetType` | string | `paid` or `free`. |
| `estimatedCost` | number | Expected per-person cost. |
| `capacity` | number | Max confirmed participants. |
| `currentParticipantCount` | number | Cached for feed speed. |
| `formationStatus` | string | `forming`, `nearly_full`, `formed`, `ongoing`, `ended`, `cancelled`. |
| `photos` | object[] | Reviewed public photos, source labels, alt text. |
| `attractionSummary` | string | Long-form `种草理由`. |
| `venueProofs` | string[] | Venue proof labels. |
| `experienceHighlights` | object[] | Dish/place/activity highlights. |
| `locationGuide` | string | Arrival and location note. |
| `aaRule` | string | Settlement instruction. |
| `cancellationRule` | string | Participant and JuZhang exit rules. |
| `privacyRule` | string | Contact boundary. |
| `requiresSettlement` | boolean | False for free activities. |
| `publishedBy` | string | Internal ops user/admin id. |
| `reviewStatus` | string | `draft`, `pending`, `approved`, `rejected`. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- `city`, `startsAt`, `reviewStatus`.
- `formationStatus`, `type`.

### `registrations`

Stores user activity participation state.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Registration id. |
| `activityId` | string | Linked activity. |
| `userId` | string | Linked user. |
| `status` | string | `confirmed`, `waitlisted`, `cancelled`, `arrived`, `completed`, `noShow`. |
| `willingToBeJuZhang` | boolean | User opt-in only. |
| `arrivalStatusUpdatedAt` | datetime | Last arrival sync time. |
| `cancelledAt` | datetime | Optional. |
| `cancelPenaltyApplied` | boolean | Internal scoring flag. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- Unique `activityId + userId`.
- `userId + status`.
- `activityId + status`.

### `waitlists`

Stores full-activity and JuZhang candidate queues.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Waitlist id. |
| `activityId` | string | Linked activity. |
| `userId` | string | Linked user. |
| `type` | string | `activity` or `juZhang`. |
| `order` | number | Queue order within activity and type. |
| `status` | string | `waiting`, `promoted`, `cancelled`, `expired`. |
| `promotedAt` | datetime | Optional. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- Unique `activityId + userId + type`.
- `activityId + type + status + order`.

### `juZhangAssignments`

Stores host candidate and selected host state.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Assignment id. |
| `activityId` | string | Linked activity. |
| `userId` | string | Candidate/selected JuZhang. |
| `status` | string | `candidate`, `invited`, `accepted`, `declined`, `active`, `completed`, `withdrawn`, `replaced`. |
| `volunteered` | boolean | True for active opt-in. |
| `selectedAt` | datetime | When system selected/invited. |
| `acceptedAt` / `declinedAt` | datetime | Optional. |
| `replacementReason` | string | Optional. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- `activityId + status`.
- Unique `activityId + userId`.

### `settlements`

Stores AA/payment confirmation state.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Settlement id. |
| `activityId` | string | Linked activity. |
| `type` | string | `paid` or `free`. |
| `totalAmount` | number | Actual bill entered by JuZhang if needed. |
| `perPersonAmount` | number | Calculated result. |
| `participantCount` | number | Confirmed participant count. |
| `paymentStatusByUser` | object | User id to `pending`, `paid`, `confirmedByJuZhang`. |
| `merchantPaymentMode` | string | `selfPayToMerchant`, `juZhangCollects`, `free`. |
| `confirmedByJuZhangAt` | datetime | Optional. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- Unique `activityId`.

### `topicCards`

Stores AI generated topic cards.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Topic card id. |
| `activityId` | string | Linked activity. |
| `visibleText` | string | User-facing topic. |
| `seedProfileSummary` | string | Non-sensitive summary of participants. |
| `status` | string | `generated`, `approved`, `hidden`. |
| `generatedBy` | string | Model or internal tool id. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- `activityId + status`.

### `feedback`

Stores post-event mutual selection and abnormal feedback.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Feedback id. |
| `activityId` | string | Linked activity. |
| `userId` | string | Feedback author. |
| `selectedUserIds` | string[] | Users this participant chose. |
| `abnormalText` | string | Reviewed abnormal feedback text. |
| `abnormalTags` | string[] | Optional ops tags. |
| `reviewStatus` | string | `pending`, `reviewed`, `escalated`. |
| `createdAt` / `updatedAt` | datetime | Audit timestamps. |

Indexes:

- Unique `activityId + userId`.
- `activityId + reviewStatus`.

### `adminActions`

Stores moderation and operational actions.

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Admin action id. |
| `adminUserId` | string | Internal operator. |
| `targetType` | string | `user`, `activity`, `registration`, `feedback`, `image`. |
| `targetId` | string | Target document id. |
| `actionType` | string | `approve`, `reject`, `remove`, `limit`, `block`, `restore`, `note`. |
| `reason` | string | Required for destructive actions. |
| `createdAt` | datetime | Audit timestamp. |

Indexes:

- `targetType + targetId`.
- `adminUserId + createdAt`.

## Access Rules

- Client can read approved activities, its own registrations, its own waitlists, and its own feedback state.
- Client cannot write directly to core collections except safe profile preferences.
- Signup, cancellation, waitlist promotion, JuZhang assignment, settlement, and feedback must go through cloud functions.
- Admin collections require internal role checks.

## Migration From Mock Services

- `apps/miniprogram/src/services/activityService.ts` maps to `activities`.
- `registrationService.ts` maps to `registrations`, `waitlists`, and `settlements`.
- `juZhangService.ts` maps to `juZhangAssignments`, `registrations`, `topicCards`, and `settlements`.
- `feedbackService.ts` maps to `feedback`.
