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
});
