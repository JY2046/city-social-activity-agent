# Mini Program QA Results - 2026-06-09

## Scope

This QA pass focused on local WeChat Developer Tools import and repository-side checks for the Mini Program MVP.

## Environment

- Project path: `/Users/lily/Documents/社交网站/.worktrees/city-activity-mvp/apps/miniprogram`
- WeChat Developer Tools app: `/Applications/wechatwebdevtools.app`
- IDE service port: `9420`
- AppID mode: `touristappid`
- Mini Program root: `dist/`

## AppID Privacy Note

The public repository should keep `apps/miniprogram/project.config.json` on `touristappid`.

Reason:

- A Mini Program AppID is an application identifier, not the AppSecret.
- Exposing only AppID does not grant upload, admin, cloud database, payment, or API access.
- Still, a real AppID can publicly associate this repository with the Mini Program before launch.

For preview QA, temporarily replace `touristappid` with the real AppID locally, generate the preview QR code, then restore `touristappid` before committing.

Never commit:

- AppSecret
- cloud environment secret keys
- payment merchant secrets
- private API tokens
- production database credentials

## Import Result

Imported successfully through WeChat Developer Tools CLI:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open \
  --port 9420 \
  --project /Users/lily/Documents/社交网站/.worktrees/city-activity-mvp/apps/miniprogram \
  --lang zh \
  --disable-gpu
```

The IDE service reported:

```text
IDE 启动成功，HTTP 服务地址 http://127.0.0.1:9420
open
```

## Issue Found

WeChat Developer Tools `build-npm` initially reported:

```text
__NO_NODE_MODULES__ NPM packages not found
```

Root cause:

- `miniprogramRoot` points to `dist/`.
- WeChat Developer Tools could not infer where to build npm packages from the app package structure.

Fix:

- Added `setting.packNpmManually`.
- Added `setting.packNpmRelationList` with:
  - `packageJsonPath: ./package.json`
  - `miniprogramNpmDistDir: ./dist`

Post-fix result:

```text
✔ build-npm
{
  "cost": 599,
  "warnings": []
}
```

## Verification

Repository tests:

```bash
npm test
```

Result:

```text
Test Files  13 passed (13)
Tests       81 passed (81)
```

Mini Program build:

```bash
npm --workspace apps/miniprogram run build:weapp
```

Result:

```text
Webpack compiled successfully
```

Developer Tools npm build:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli build-npm \
  --port 9420 \
  --project /Users/lily/Documents/社交网站/.worktrees/city-activity-mvp/apps/miniprogram
```

Result:

```text
✔ build-npm
warnings: []
```

Compiled output check:

- `dist/app.json` contains all 8 MVP pages.
- `dist/app.json` contains the 4-tab navigation.
- `dist/assets/images` contains 6 local activity images.
- `dist/pages` contains compiled page `js/json/wxml/wxss` files.

## Not Completed In This Pass

Visual device QA was not completed from Codex because two actions require explicit authorization:

- Generating a WeChat preview QR code uploads the Mini Program package to WeChat/Tencent.
- Taking a full macOS screenshot may capture unrelated private desktop content.

After authorization, the next QA pass should cover:

- iOS WeChat preview.
- Android WeChat preview.
- visual overlap checks on the Discover page, activity detail page, itinerary, signup, and JuZhang workspace.
- bottom safe-area checks.
- scroll-to-bottom checks.
