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

  it("fails fast when a seed document is missing an _id", async () => {
    const db = createFakeDatabase();
    const seed = createCloudSeedData();

    await expect(
      seedCloudDatabase(db, {
        ...seed,
        users: [{ ...seed.users[0], _id: undefined as unknown as string }],
      }),
    ).rejects.toThrow('Invalid seed document in collection "users": missing string _id');
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

  it("reactivates a cancelled registration when the user signs up again", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, "u-current");
    await adapter.cancelRegistration({ activityId: "a-coffee" }, "u-current");

    await expect(
      adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, "u-current"),
    ).resolves.toMatchObject({
      activityId: "a-coffee",
      userId: "u-current",
      status: "confirmed",
      willingToBeJuZhang: true,
    });
    expect(db.dump().activities["a-coffee"]).toMatchObject({
      participantIds: expect.arrayContaining(["u-current"]),
    });
  });

  it("lists only the current user's non-cancelled registrations", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, "u-current");
    await adapter.signupActivity({ activityId: "a-bar", willingToBeJuZhang: false }, "u-current");
    await adapter.signupActivity({ activityId: "a-walk", willingToBeJuZhang: false }, "u-current");
    await adapter.cancelRegistration({ activityId: "a-walk" }, "u-current");

    await expect(adapter.listMyRegistrations("u-current")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ activityId: "a-coffee", status: "confirmed" }),
        expect.objectContaining({ activityId: "a-bar", status: "waitlisted" }),
      ]),
    );
    await expect(adapter.listMyRegistrations("u-current")).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ activityId: "a-walk" })]),
    );
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

  it("rejects invalid arrival and ju zhang response states", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, "u-current");

    await expect(adapter.confirmArrival({ activityId: "a-coffee", status: "admin" as never }, "u-current")).rejects
      .toThrow("Invalid arrival status");
    await expect(
      adapter.respondJuZhangAssignment({ activityId: "a-sushi", response: "maybe" as never }, "u-current"),
    ).rejects.toThrow("Invalid ju zhang response");
  });

  it("prevents ordinary users from updating other participants while allowing the assigned ju zhang", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    await expect(
      adapter.confirmArrival({ activityId: "a-sushi", userId: "u-momo", status: "arrived" }, "u-current"),
    ).rejects.toThrow("Forbidden");
    await expect(
      adapter.confirmSettlement(
        { activityId: "a-sushi", mode: "juZhangCollects", participantPaymentStates: { "u-momo": true } },
        "u-current",
      ),
    ).rejects.toThrow("Forbidden");

    await expect(adapter.confirmArrival({ activityId: "a-sushi", userId: "u-momo", status: "arrived" }, "u-qiao"))
      .resolves.toMatchObject({
        activityId: "a-sushi",
        userId: "u-momo",
        status: "arrived",
      });
    await expect(
      adapter.confirmSettlement(
        { activityId: "a-sushi", mode: "juZhangCollects", participantPaymentStates: { "u-momo": true } },
        "u-qiao",
      ),
    ).resolves.toMatchObject({
      activityId: "a-sushi",
      paymentStatusByUser: expect.objectContaining({ "u-momo": true }),
    });
  });

  it("supports ju zhang workspace and post-activity feedback state", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);

    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, "u-current");

    await expect(adapter.getJuZhangWorkspace("a-coffee", "u-current")).resolves.toMatchObject({
      currentUserId: "u-current",
      activity: { id: "a-coffee" },
      topicCard: { activityId: "a-coffee" },
      settlement: { activityId: "a-coffee" },
      activeRegistrations: expect.arrayContaining([expect.objectContaining({ activityId: "a-coffee" })]),
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

  it("returns ju zhang queue state in the workspace", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-sushi", willingToBeJuZhang: true }, "u-current");
    await adapter.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, "u-current");

    await expect(adapter.getJuZhangWorkspace("a-sushi", "u-current")).resolves.toMatchObject({
      currentUserId: "u-current",
      activity: { id: "a-sushi" },
      assignment: { candidateUserId: "u-qiao", status: "accepted" },
      juZhangWaitlistEntry: { activityId: "a-sushi", type: "juZhang", status: "waiting" },
    });
  });

  it("opens ju zhang workspace without tasks when the current user did not opt in", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: false }, "u-current");

    await expect(adapter.getJuZhangWorkspace("a-coffee", "u-current")).resolves.toMatchObject({
      activity: { id: "a-coffee" },
      currentRegistration: { activityId: "a-coffee", willingToBeJuZhang: false },
      assignment: undefined,
      activeRegistrations: [],
      tasks: [],
    });
  });

  it("cancels ju zhang waitlist entries", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.joinWaitlist({ activityId: "a-sushi", type: "juZhang" }, "u-current");

    await expect(adapter.cancelWaitlist({ activityId: "a-sushi", type: "juZhang" }, "u-current")).resolves
      .toMatchObject({
        activityId: "a-sushi",
        type: "juZhang",
        status: "cancelled",
      });
  });

  it("hides ju zhang workspace after the current user cancels registration", async () => {
    const db = createFakeDatabase();
    await seedCloudDatabase(db, createCloudSeedData());
    const adapter = createCloudDatabaseAdapter(db);
    await adapter.signupActivity({ activityId: "a-coffee", willingToBeJuZhang: true }, "u-current");
    await adapter.respondJuZhangAssignment({ activityId: "a-coffee", response: "accepted" }, "u-current");

    await expect(adapter.getJuZhangWorkspace("a-coffee", "u-current")).resolves.toMatchObject({
      activity: { id: "a-coffee" },
      assignment: { status: "accepted" },
    });

    await adapter.cancelRegistration({ activityId: "a-coffee" }, "u-current");

    await expect(adapter.getJuZhangWorkspace("a-coffee", "u-current")).resolves.toMatchObject({
      activity: undefined,
      assignment: undefined,
      activeRegistrations: [],
      tasks: [],
    });
  });
});
