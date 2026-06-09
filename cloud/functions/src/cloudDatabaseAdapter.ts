import type { ActivityFeedQuery } from "./cloudHandlers";
import type { CloudActivityDocument, CloudSeedData } from "./cloudSeed";

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
  };
}
