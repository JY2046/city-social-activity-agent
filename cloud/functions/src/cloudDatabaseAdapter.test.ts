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
              if (typeof input.data === "object" && input.data !== null && "_id" in input.data) {
                throw new Error("document.set:fail -501007 invalid parameters. 不能更新_id的值");
              }

              collections[name][id] = { _id: id, ...(input.data as Record<string, unknown>) };
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

  it("signs up available activities and updates participant and settlement state", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    const registration = await adapter.signupActivity(
      { activityId: "a-coffee", willingToBeJuZhang: true },
      "u-current",
    );

    expect(registration).toMatchObject({
      _id: "r-a-coffee-u-current",
      activityId: "a-coffee",
      userId: "u-current",
      status: "confirmed",
      willingToBeJuZhang: true,
    });
    expect(db.dump().activities["a-coffee"]).toMatchObject({
      currentParticipantCount: 3,
      participantIds: expect.arrayContaining(["u-current"]),
    });
    expect(db.dump().settlements["a-coffee"]).toMatchObject({
      participantCount: 3,
      paymentStatusByUser: expect.objectContaining({ "u-current": false }),
    });
  });

  it("cancels active registrations and updates participant state", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, "u-current");

    await expect(adapter.cancelRegistration({ activityId: "a-coffee" }, "u-current")).resolves.toMatchObject({
      activityId: "a-coffee",
      userId: "u-current",
      status: "cancelled",
    });
    expect(db.dump().activities["a-coffee"]).toMatchObject({
      currentParticipantCount: 2,
      participantIds: expect.not.arrayContaining(["u-current"]),
    });
    expect(db.dump().settlements["a-coffee"]).toMatchObject({
      participantCount: 2,
      paymentStatusByUser: expect.not.objectContaining({ "u-current": expect.any(Boolean) }),
    });
  });

  it("waitlists full activities and keeps waitlist entries idempotent", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    const registration = await adapter.signupActivity(
      { activityId: "a-bar", willingToBeJuZhang: false },
      "u-current",
    );
    const firstQueue = await adapter.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, "u-current");
    const secondQueue = await adapter.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, "u-current");

    expect(registration).toMatchObject({ activityId: "a-bar", status: "waitlisted" });
    expect(firstQueue).toMatchObject({ _id: "w-a-sushi-juZhang-u-current", order: 1 });
    expect(secondQueue).toEqual(firstQueue);
  });

  it("confirms arrival and settlement payment state", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, "u-current");

    await expect(adapter.confirmArrival({ activityId: "a-coffee", status: "arrived" }, "u-current")).resolves.toMatchObject({
      activityId: "a-coffee",
      userId: "u-current",
      status: "arrived",
    });
    await expect(
      adapter.confirmSettlement({ activityId: "a-coffee", mode: "selfPayToMerchant" }, "u-current"),
    ).resolves.toMatchObject({
      activityId: "a-coffee",
      paymentStatusByUser: expect.objectContaining({ "u-current": true }),
    });
  });

  it("supports ju zhang workspace and post-activity feedback state", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    await expect(adapter.getJuZhangWorkspace("a-sushi")).resolves.toMatchObject({
      activity: { id: "a-sushi" },
      topicCard: { activityId: "a-sushi" },
      settlement: { activityId: "a-sushi" },
      activeRegistrations: expect.arrayContaining([expect.objectContaining({ activityId: "a-sushi" })]),
      tasks: expect.arrayContaining([expect.objectContaining({ title: "开场 & 破冰" })]),
    });

    await expect(adapter.respondJuZhangAssignment({ activityId: "a-sushi", response: "accepted" }, "u-current")).resolves
      .toMatchObject({
        activityId: "a-sushi",
        candidateUserId: "u-current",
        status: "accepted",
      });

    await adapter.submitFeedback(
      { activityId: "a-sushi", selectedUserIds: ["u-lin"], abnormalText: "整体体验不错" },
      "u-current",
    );
    await adapter.submitFeedback({ activityId: "a-sushi", selectedUserIds: ["u-current"], abnormalText: "" }, "u-lin");

    await expect(adapter.getFeedbackCompletionState({ activityId: "a-sushi", candidateUserId: "u-lin" }, "u-current"))
      .resolves.toEqual({
        hasSubmitted: true,
        isMutual: true,
        contactStateLabel: "已互选，可开放联系",
      });
  });
});
