# City Social Activity Agent

城市轻社交活动平台的可点击 MVP 原型。第一版聚焦平台官方创建的饭局、咖啡局、小酒馆局和免费城市活动，验证陌生人能否围绕一个具体线下活动安全见面，并在活动后再决定是否互相开放联系。

## Prototype Scope

- 活动发现：展示时间、区域、人均预算或免费、人数状态和 AI 推荐理由。
- 活动详情：展示 AA/免费规则、退出规则、隐私边界和参与者预览。
- 报名确认：确认规则，并可选择是否愿意担任“局长”。
- 行程页：展示成局状态、集合地点、AI 到场提醒和局长入口。
- 局长任务：支持接受或拒绝局长，展示到场确认、AI 话题卡和 AA/免费结算状态。
- 活动后反馈：支持异常反馈和参与者互选，强调双方互选后才开放联系方式。

## Product Rules Captured

- 普通参与者活动前 12 小时内退出会影响内部信誉。
- 局长接受后 24 小时内退出会触发重新选择，并更明显影响内部信誉。
- 拒绝担任局长不影响继续参加活动。
- 第一版不公开具体信用分，只展示柔性的等级和可选参加场次。
- 活动前不开放私信或联系方式；活动后双方互选才开放联系。
- 付费活动走线下 AA 结算，免费活动显示无费用并跳过 AA。

## Local Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm test
npm run build
```

## Tech Stack

- Vite
- React
- TypeScript
- Vitest
- Testing Library
- Lucide React
- Plain CSS
