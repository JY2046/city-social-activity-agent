# CodeRabbit PR Review Setup

This repository uses `.coderabbit.yaml` for version-controlled CodeRabbit settings.

## What Is Automated

After the CodeRabbit GitHub App is installed for this repository:

- CodeRabbit reviews pull requests automatically.
- CodeRabbit performs an incremental review after every new push.
- Draft PRs are included.
- Reviews use concise Chinese comments.
- Generated Mini Program output, dependencies, build artifacts, and image binaries are excluded from review.

## Required GitHub Setup

The YAML file alone is not enough. The repository owner must install the CodeRabbit GitHub App:

1. Open CodeRabbit: <https://coderabbit.ai/>
2. Sign in with GitHub.
3. Install the CodeRabbit GitHub App.
4. Choose repository access for `JY2046/city-social-activity-agent`.
5. Keep CodeRabbit enabled for pull request reviews.

## Current Pull Request

If CodeRabbit is installed after a PR already exists, trigger a review manually once by commenting on the PR:

```text
@coderabbitai review
```

For a full review from scratch:

```text
@coderabbitai full review
```

After that, every new push to the PR branch should trigger an incremental review automatically.

## Useful Commands In PR Comments

- `@coderabbitai review` - incremental review of new changes.
- `@coderabbitai full review` - full review from scratch.
- `@coderabbitai pause` - pause automatic reviews.
- `@coderabbitai resume` - resume automatic reviews.

## Security Notes

Do not commit:

- WeChat Mini Program AppSecret.
- cloud environment secret keys.
- payment merchant secrets.
- private API tokens.
- production database credentials.

Keep `apps/miniprogram/project.config.json` on `touristappid` in the public repository. Use the real AppID only as a local temporary change for preview QR generation.
