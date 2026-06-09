import { describe, expect, it } from "vitest";

import { createCloudDatabaseAdapter, seedCloudDatabase, type CloudDatabaseLike } from "./cloudDatabaseAdapter";
import { createCloudSeedData } from "./cloudSeed";

function createFakeDatabase(): CloudDatabaseLike & { dump: () => Record<string, Record<string, unknown>> } {
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
    dump() {
      return collections;
    },
  };
}

describe("cloud database adapter", () => {
  it("imports seed documents into named cloud collections", async () => {
    const db = createFakeDatabase();

    await seedCloudDatabase(db, createCloudSeedData());

    expect(db.dump().activities["a-sushi"]).toMatchObject({ _id: "a-sushi", city: "上海" });
    expect(db.dump().users["u-current"]).toMatchObject({ _id: "u-current" });
  });

  it("reads approved activities through the database adapter", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    await expect(adapter.listActivities({ city: "上海" })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "a-sushi", title: "周五下班日料小局" })]),
    );
    await expect(adapter.getActivity("a-sushi")).resolves.toMatchObject({
      id: "a-sushi",
      coverImagePath: "/assets/images/activity-sushi.jpg",
    });
  });
});
