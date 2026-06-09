# Mini Program Cloud Adapter

This document explains how the Mini Program moves from local mock services to WeChat Cloud Development without rewriting every page at once.

## Current Status

The app still runs in `mock` mode by default so the visual prototype remains easy to open in WeChat Developer Tools.

The first cloud adapter layer has been added:

- `apps/miniprogram/src/services/cloudFunctionClient.ts`
- `apps/miniprogram/src/services/cloudRuntime.ts`
- `apps/miniprogram/src/services/cloudServices.ts`

These files define:

- a typed `ok / code / message / data` cloud function envelope
- consistent `CloudFunctionError` handling
- wrappers for activity, signup, waitlist, itinerary, JuZhang, settlement, and feedback functions
- safe runtime initialization for `wx.cloud`
- build-time switching between `mock` and `cloud`

## Build-Time Switch

Default mode:

```bash
npm --workspace apps/miniprogram run build:weapp
```

Cloud mode:

```bash
CITY_SOCIAL_DATA_SOURCE=cloud WECHAT_CLOUD_ENV_ID=<your-env-id> npm --workspace apps/miniprogram run build:weapp
```

Rules:

- `CITY_SOCIAL_DATA_SOURCE=mock` keeps local mock services active.
- `CITY_SOCIAL_DATA_SOURCE=cloud` enables cloud-mode checks for future async page adapters.
- `WECHAT_CLOUD_ENV_ID` initializes `wx.cloud` when provided.
- If no cloud environment id is provided, the app skips cloud initialization.

## Cloud Function Response Contract

Every cloud function should return the same envelope:

```ts
interface CloudFunctionEnvelope<T> {
  ok: boolean;
  code: string;
  message: string;
  data: T;
}
```

Successful response:

```json
{
  "ok": true,
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

Failure response:

```json
{
  "ok": false,
  "code": "ACTIVITY_NOT_FOUND",
  "message": "Activity not found",
  "data": null
}
```

The Mini Program client converts failure envelopes into `CloudFunctionError`, preserving:

- `functionName`
- `code`
- `message`

## Added Client Wrappers

Activity:

- `cloudListActivities`
- `cloudGetActivity`

Signup and itinerary:

- `cloudSignupActivity`
- `cloudJoinWaitlist`
- `cloudConfirmArrival`
- `cloudConfirmSettlement`

JuZhang:

- `cloudGetJuZhangWorkspace`
- `cloudAcceptJuZhang`
- `cloudDeclineJuZhang`

Feedback:

- `cloudSubmitFeedback`
- `cloudGetFeedbackCompletionState`

## Next Implementation Step

Current async adapter coverage:

- Discover and activity detail read through the async activity read boundary.
- Signup, waitlist, itinerary arrival, and itinerary settlement write through the async registration write boundary.
- Uploadable cloud function packages now cover activity reads, signup, waitlist, arrival, settlement, JuZhang workspace, JuZhang response, feedback submission, and feedback completion state.

Remaining page migration work:

1. Let signup, waitlist, itinerary, JuZhang, and feedback pages load their display context from cloud reads when `CITY_SOCIAL_DATA_SOURCE=cloud`.
2. Add JuZhang and feedback async page adapters with loading and error states.
3. Keep mock mode as the default visual prototype path.

This keeps the existing mock prototype stable while cloud mode is introduced page by page.

## WeChat Developer Tools Import

Import this local directory:

```text
/Users/lily/Documents/社交网站/.worktrees/city-activity-mvp/apps/miniprogram
```

The project config points WeChat Developer Tools to:

```json
{
  "miniprogramRoot": "dist/"
}
```

Build before opening or previewing:

```bash
npm --workspace apps/miniprogram run build:weapp
```
