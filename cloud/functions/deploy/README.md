# WeChat Cloud Function Deployment Folder

This folder is reserved for WeChat Developer Tools uploadable cloud function packages.

Current status:

- Shared, locally tested TypeScript handlers live in `cloud/functions/src`.
- The first seed JSON files live in `cloud/seed`.
- Uploadable function folders should be generated here only after the TypeScript handlers are bundled into JavaScript with `wx-server-sdk`.

Planned function folders:

- `listActivities`
- `getActivityDetail`
- `signupActivity`
- `joinWaitlist`
- `confirmArrival`
- `confirmSettlement`

Do not upload placeholder functions from this folder. Each function folder must contain a real `index.js` and `package.json` before deployment.
