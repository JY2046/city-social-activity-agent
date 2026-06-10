import { describe, expect, it } from "vitest";

import { createCloudDatabaseAdapter, seedCloudDatabase, type CloudDatabaseLike } from "./cloudDatabaseAdapter";
import { createCloudDatabaseHandlers } from "./cloudDatabaseHandlers";
import { createCloudFunctionDispatcher } from "./cloudRuntime";
import { createCloudSeedData } from "./cloudSeed";

function createFakeDatabase(): CloudDatabaseLike {
  const collections: Record<string, Record<string, unknown>> = {};

  return {
    collection(name) {
      collections[name] ??= {};

      return {
        doc(id) {
          return {
            async get() {
              return { data: collections[name][id] };
            },
            async set(input) {
              collections[name][id] = input.data;
              return {};
            },
            async update(input) {
              collections[name][id] = {
                ...(collections[name][id] as Record<string, unknown> | undefined),
                ...input.data,
              };
              return {};
            },
          };
        },
        where(query) {
          return {
            async get() {
              return {
                data: Object.values(collections[name]).filter((document) =>
                  Object.entries(query).every(([key, value]) => (document as Record<string, unknown>)[key] === value),
                ),
              };
            },
          };
        },
      };
    },
  };
}

describe("cloud database handlers", () => {
  it("dispatches database-backed activity reads and signup writes through envelopes", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const dispatch = createCloudFunctionDispatcher(createCloudDatabaseHandlers(createCloudDatabaseAdapter(db)));

    await expect(dispatch("listActivities", { city: "上海" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      data: expect.arrayContaining([expect.objectContaining({ id: "a-sushi" })]),
    });
    await expect(
      dispatch("signupActivity", { activityId: "a-coffee", willingToBeJuZhang: true }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-coffee", userId: "u-current", status: "confirmed" },
    });
    await expect(dispatch("cancelRegistration", { activityId: "a-coffee" }, { userId: "u-current" })).resolves
      .toMatchObject({
        ok: true,
        data: { activityId: "a-coffee", userId: "u-current", status: "cancelled" },
      });
  });

  it("converts database adapter failures to failure envelopes", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const dispatch = createCloudFunctionDispatcher(createCloudDatabaseHandlers(createCloudDatabaseAdapter(db)));

    await expect(
      dispatch("signupActivity", { activityId: "missing", willingToBeJuZhang: false }, { userId: "u-current" }),
    ).resolves.toEqual({
      ok: false,
      code: "ACTIVITY_NOT_FOUND",
      message: "Activity not found",
      data: null,
    });
  });

  it("dispatches ju zhang and feedback database-backed functions", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const dispatch = createCloudFunctionDispatcher(createCloudDatabaseHandlers(createCloudDatabaseAdapter(db)));

    await expect(dispatch("getJuZhangWorkspace", { activityId: "a-sushi" }, { userId: "u-current" })).resolves
      .toMatchObject({
        ok: true,
        data: {
          activity: { id: "a-sushi" },
          tasks: expect.arrayContaining([expect.objectContaining({ title: "AA 结算确认" })]),
        },
      });

    await expect(
      dispatch("respondJuZhangAssignment", { activityId: "a-sushi", response: "accepted" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-sushi", candidateUserId: "u-current", status: "accepted" },
    });

    await expect(
      dispatch(
        "submitFeedback",
        { activityId: "a-sushi", selectedUserIds: ["u-lin"], abnormalText: "" },
        { userId: "u-current" },
      ),
    ).resolves.toMatchObject({
      ok: true,
      data: { activityId: "a-sushi", userId: "u-current", selectedUserIds: ["u-lin"] },
    });

    await expect(
      dispatch("getFeedbackCompletionState", { activityId: "a-sushi", candidateUserId: "u-lin" }, { userId: "u-current" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { hasSubmitted: true, isMutual: false, contactStateLabel: "已提交反馈" },
    });
  });
});
