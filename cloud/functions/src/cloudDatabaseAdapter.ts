import type {
  ActivityFeedQuery,
  ArrivalStatus,
  ConfirmArrivalInput,
  ConfirmSettlementInput,
  GetFeedbackCompletionStateInput,
  JoinWaitlistInput,
  RespondJuZhangAssignmentInput,
  SignupActivityInput,
  SubmitFeedbackInput,
} from "./cloudHandlers";
import type {
  CloudActivityDocument,
  CloudFeedbackDocument,
  CloudJuZhangAssignmentDocument,
  CloudRegistrationDocument,
  CloudSeedData,
  CloudSettlementDocument,
  CloudTopicCardDocument,
} from "./cloudSeed";

export interface CloudDocumentReference {
  get: () => Promise<{ data?: unknown }>;
  set: (input: { data: unknown }) => Promise<unknown>;
  update: (input: { data: Record<string, unknown> }) => Promise<unknown>;
}

export interface CloudQueryReference {
  get: () => Promise<{ data: unknown[] }>;
}

export interface CloudCollectionReference {
  doc: (id: string) => CloudDocumentReference;
  where: (query: Record<string, unknown>) => CloudQueryReference;
}

export interface CloudDatabaseLike {
  collection: (name: string) => CloudCollectionReference;
}

const seedCollectionOrder: Array<keyof CloudSeedData> = [
  "users",
  "activities",
  "registrations",
  "settlements",
  "waitlists",
  "juZhangAssignments",
  "topicCards",
  "feedback",
  "adminActions",
];

const juZhangTasks = [
  { title: "开场 & 破冰", description: "借助 AI 话题卡自然开启对话" },
  { title: "活动中协调", description: "关注大家体验，必要时协助沟通" },
  { title: "AA 结算确认", description: "活动后确认每个人的支付状态" },
];

const activeRegistrationStatuses = new Set(["confirmed", "arrived"]);

function compactQuery(query: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));
}

function hasDocumentId(value: unknown): value is { _id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    typeof (value as Record<string, unknown>)._id === "string"
  );
}

function now(): string {
  return "2026-06-09T12:00:00.000Z";
}

async function getDocument<T>(db: CloudDatabaseLike, collectionName: string, id: string): Promise<T | undefined> {
  const result = await db.collection(collectionName).doc(id).get();

  return result.data as T | undefined;
}

async function setDocument<T extends { _id: string }>(
  db: CloudDatabaseLike,
  collectionName: string,
  document: T,
): Promise<T> {
  await db.collection(collectionName).doc(document._id).set({ data: document });

  return document;
}

async function findRegistration(
  db: CloudDatabaseLike,
  activityId: string,
  userId: string,
): Promise<CloudRegistrationDocument | undefined> {
  const result = await db.collection("registrations").where({ activityId, userId }).get();

  return result.data[0] as CloudRegistrationDocument | undefined;
}

function isMutualContact(
  firstUserId: string,
  secondUserId: string,
  selections: Record<string, string[]>,
): boolean {
  return (
    selections[firstUserId]?.includes(secondUserId) === true &&
    selections[secondUserId]?.includes(firstUserId) === true
  );
}

async function findJuZhangAssignment(
  db: CloudDatabaseLike,
  activityId: string,
  userId: string,
): Promise<CloudJuZhangAssignmentDocument | undefined> {
  const result = await db.collection("juZhangAssignments").where({ activityId, candidateUserId: userId }).get();

  return result.data[0] as CloudJuZhangAssignmentDocument | undefined;
}

async function createOrGetWaitlistEntry(
  db: CloudDatabaseLike,
  input: JoinWaitlistInput,
  userId: string,
) {
  const existingResult = await db.collection("waitlists").where({
    activityId: input.activityId,
    userId,
    type: input.type,
  }).get();
  const existingEntry = existingResult.data[0];

  if (existingEntry) {
    return existingEntry;
  }

  const queueResult = await db.collection("waitlists").where({ activityId: input.activityId, type: input.type }).get();
  const timestamp = now();
  const entry = {
    _id: `w-${input.activityId}-${input.type}-${userId}`,
    id: `w-${input.activityId}-${input.type}-${userId}`,
    activityId: input.activityId,
    userId,
    type: input.type,
    order: queueResult.data.length + 1,
    status: "waiting",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return setDocument(db, "waitlists", entry);
}

export async function seedCloudDatabase(db: CloudDatabaseLike, seedData: CloudSeedData): Promise<void> {
  for (const collectionName of seedCollectionOrder) {
    const documents = seedData[collectionName] as unknown[];

    for (const document of documents) {
      if (!hasDocumentId(document)) {
        continue;
      }

      await db.collection(collectionName).doc(document._id).set({ data: document });
    }
  }
}

export function createCloudDatabaseAdapter(db: CloudDatabaseLike) {
  return {
    async listActivities(query: ActivityFeedQuery = {}): Promise<CloudActivityDocument[]> {
      const result = await db.collection("activities").where(
        compactQuery({
          city: query.city,
          type: query.type,
          budgetType: query.budgetType,
          reviewStatus: "approved",
        }),
      ).get();
      const keyword = query.keyword?.trim().toLowerCase();
      const activities = result.data as CloudActivityDocument[];

      if (!keyword) {
        return activities;
      }

      return activities.filter((activity) =>
        `${activity.title} ${activity.area} ${activity.venue}`.toLowerCase().includes(keyword),
      );
    },

    async getActivity(activityId: string): Promise<CloudActivityDocument | undefined> {
      const result = await db.collection("activities").doc(activityId).get();
      const activity = result.data as CloudActivityDocument | undefined;

      return activity?.reviewStatus === "approved" ? activity : undefined;
    },

    async signupActivity(input: SignupActivityInput, userId: string): Promise<CloudRegistrationDocument> {
      const activity = await getDocument<CloudActivityDocument>(db, "activities", input.activityId);

      if (!activity || activity.reviewStatus !== "approved") {
        throw new Error("Activity not found");
      }

      const existingRegistration = await findRegistration(db, input.activityId, userId);

      if (existingRegistration) {
        return existingRegistration;
      }

      const timestamp = now();
      const registration: CloudRegistrationDocument = {
        _id: `r-${input.activityId}-${userId}`,
        id: `r-${input.activityId}-${userId}`,
        activityId: input.activityId,
        userId,
        status: activity.currentParticipantCount >= activity.capacity ? "waitlisted" : "confirmed",
        willingToBeJuZhang: input.willingToBeJuZhang,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      if (registration.status === "waitlisted") {
        await createOrGetWaitlistEntry(db, { activityId: input.activityId, type: "activity" }, userId);
        return setDocument(db, "registrations", registration);
      }

      await setDocument(db, "registrations", registration);
      await setDocument(db, "activities", {
        ...activity,
        currentParticipantCount: activity.currentParticipantCount + 1,
        participantIds: [...activity.participantIds, userId],
        formationStatus:
          activity.currentParticipantCount + 1 >= activity.capacity ? "formed" : activity.formationStatus,
        updatedAt: timestamp,
      });

      const settlement = await getDocument<CloudSettlementDocument>(db, "settlements", input.activityId);

      if (settlement && settlement.type === "paid") {
        await setDocument(db, "settlements", {
          ...settlement,
          participantCount: settlement.participantCount + 1,
          paymentStatusByUser: {
            ...settlement.paymentStatusByUser,
            [userId]: false,
          },
          updatedAt: timestamp,
        });
      }

      return registration;
    },

    async joinWaitlist(input: JoinWaitlistInput, userId: string) {
      const activity = await getDocument<CloudActivityDocument>(db, "activities", input.activityId);

      if (!activity || activity.reviewStatus !== "approved") {
        throw new Error("Activity not found");
      }

      return createOrGetWaitlistEntry(db, input, userId);
    },

    async confirmArrival(input: ConfirmArrivalInput, userId: string): Promise<CloudRegistrationDocument> {
      const targetUserId = input.userId ?? userId;
      const registration = await findRegistration(db, input.activityId, targetUserId);

      if (!registration || registration.status === "waitlisted" || registration.status === "cancelled") {
        throw new Error("Active registration not found");
      }

      return setDocument(db, "registrations", {
        ...registration,
        status: input.status as ArrivalStatus,
        updatedAt: now(),
      });
    },

    async confirmSettlement(input: ConfirmSettlementInput, userId: string): Promise<CloudSettlementDocument> {
      const settlement = await getDocument<CloudSettlementDocument>(db, "settlements", input.activityId);

      if (!settlement) {
        throw new Error("Settlement not found");
      }

      if (settlement.type === "free" || settlement.totalAmount === 0 || input.mode === "free") {
        return settlement;
      }

      return setDocument(db, "settlements", {
        ...settlement,
        totalAmount: input.totalAmount ?? settlement.totalAmount,
        merchantPaymentMode: input.mode,
        paymentStatusByUser: input.participantPaymentStates
          ? { ...settlement.paymentStatusByUser, ...input.participantPaymentStates }
          : { ...settlement.paymentStatusByUser, [userId]: true },
        updatedAt: now(),
      });
    },

    async getJuZhangWorkspace(activityId: string) {
      const activity = await getDocument<CloudActivityDocument>(db, "activities", activityId);
      const assignments = await db.collection("juZhangAssignments").where({ activityId }).get();
      const topicCards = await db.collection("topicCards").where({ activityId }).get();
      const registrations = await db.collection("registrations").where({ activityId }).get();
      const settlement = await getDocument<CloudSettlementDocument>(db, "settlements", activityId);

      return {
        activity: activity?.reviewStatus === "approved" ? activity : undefined,
        assignment: assignments.data[0] as CloudJuZhangAssignmentDocument | undefined,
        topicCard: topicCards.data[0] as CloudTopicCardDocument | undefined,
        settlement,
        activeRegistrations: (registrations.data as CloudRegistrationDocument[]).filter((registration) =>
          activeRegistrationStatuses.has(registration.status),
        ),
        tasks: juZhangTasks,
      };
    },

    async respondJuZhangAssignment(
      input: RespondJuZhangAssignmentInput,
      userId: string,
    ): Promise<CloudJuZhangAssignmentDocument> {
      const existingAssignment = await findJuZhangAssignment(db, input.activityId, userId);
      const timestamp = now();
      const assignment: CloudJuZhangAssignmentDocument = {
        ...(existingAssignment ?? {
          _id: `jz-${input.activityId}-${userId}`,
          id: `jz-${input.activityId}-${userId}`,
          activityId: input.activityId,
          candidateUserId: userId,
          volunteered: true,
          createdAt: timestamp,
        }),
        status: input.response,
        updatedAt: timestamp,
      };

      return setDocument(db, "juZhangAssignments", assignment);
    },

    async submitFeedback(input: SubmitFeedbackInput, userId: string): Promise<CloudFeedbackDocument> {
      const timestamp = now();
      const feedback: CloudFeedbackDocument = {
        _id: `fb-${input.activityId}-${userId}`,
        id: `fb-${input.activityId}-${userId}`,
        activityId: input.activityId,
        userId,
        selectedUserIds: input.selectedUserIds,
        abnormalText: input.abnormalText,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return setDocument(db, "feedback", feedback);
    },

    async getFeedbackCompletionState(input: GetFeedbackCompletionStateInput, userId: string) {
      const feedbackResult = await db.collection("feedback").where({ activityId: input.activityId }).get();
      const feedbackEntries = feedbackResult.data as CloudFeedbackDocument[];
      const selections = Object.fromEntries(
        feedbackEntries.map((entry) => [entry.userId, entry.selectedUserIds]),
      ) as Record<string, string[]>;
      const hasSubmitted = feedbackEntries.some((entry) => entry.userId === userId);
      const isMutual = isMutualContact(userId, input.candidateUserId, selections);

      return {
        hasSubmitted,
        isMutual,
        contactStateLabel: isMutual ? "已互选，可开放联系" : hasSubmitted ? "已提交反馈" : "等待反馈",
      };
    },
  };
}
