# Cloud Function Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first testable WeChat Cloud Function foundation for activity read, signup, waitlist, arrival, and settlement flows.

**Architecture:** Keep cloud business logic in a shared TypeScript handler layer that can be tested locally without the WeChat runtime. Each cloud function entry later calls the same handler and wraps results in the existing `ok / code / message / data` envelope expected by the Mini Program client.

**Tech Stack:** TypeScript, Vitest, existing `@city-social/domain` types, WeChat Cloud Development function naming conventions.

---

### Task 1: Shared Cloud Handler Contract

**Files:**
- Create: `cloud/functions/src/cloudHandlers.test.ts`
- Create: `cloud/functions/src/cloudHandlers.ts`
- Create: `cloud/functions/src/cloudStore.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryCloudStore } from "./cloudStore";
import { createCloudHandlers } from "./cloudHandlers";

describe("cloud function handlers", () => {
  let handlers: ReturnType<typeof createCloudHandlers>;

  beforeEach(() => {
    handlers = createCloudHandlers(createInMemoryCloudStore());
  });

  it("lists and loads activity details through cloud envelopes", async () => {
    await expect(handlers.listActivities({ city: "上海" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      data: expect.arrayContaining([expect.objectContaining({ id: "a-sushi" })]),
    });

    await expect(handlers.getActivityDetail({ activityId: "a-sushi" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      data: { activity: expect.objectContaining({ id: "a-sushi" }) },
    });
  });

  it("signs up or waitlists the current user", async () => {
    await expect(
      handlers.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-coffee", status: "confirmed", willingToBeJuZhang: true },
    });

    await expect(
      handlers.signupActivity({ activityId: "a-bar", willingToBeJuZhang: false }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-bar", status: "waitlisted" },
    });
  });

  it("joins waitlists idempotently", async () => {
    const first = await handlers.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, { userId: "u-current" });
    const second = await handlers.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, { userId: "u-current" });

    expect(first).toMatchObject({ ok: true, data: { order: 1 } });
    expect(second).toEqual(first);
  });

  it("confirms arrival and settlement", async () => {
    await handlers.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, { userId: "u-current" });

    await expect(
      handlers.confirmArrival({ activityId: "a-coffee", status: "arrived" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "arrived" },
    });

    await expect(
      handlers.confirmSettlement({ activityId: "a-coffee", mode: "selfPayToMerchant" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { paymentStatusByUser: { "u-current": true } },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cloud/functions/src/cloudHandlers.test.ts`

Expected: FAIL because `cloudHandlers.ts` and `cloudStore.ts` do not exist.

- [ ] **Step 3: Implement the minimal handler layer**

Create `cloudStore.ts` with an in-memory store seeded from domain mock data, plus clone, activity update, registration upsert, waitlist insert, and settlement update helpers.

Create `cloudHandlers.ts` with `createCloudHandlers(store)` returning `listActivities`, `getActivityDetail`, `signupActivity`, `joinWaitlist`, `confirmArrival`, and `confirmSettlement`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cloud/functions/src/cloudHandlers.test.ts`

Expected: PASS.

### Task 2: Deployment Notes

**Files:**
- Modify: `docs/miniprogram/cloud-functions.md`

- [ ] **Step 1: Document handler entry usage**

Add a section explaining that `cloud/functions/src/cloudHandlers.ts` is the locally tested shared implementation and each WeChat cloud function should import or bundle the matching handler.

- [ ] **Step 2: Validate**

Run: `npm test` and `npm --workspace apps/miniprogram run build:weapp`.
