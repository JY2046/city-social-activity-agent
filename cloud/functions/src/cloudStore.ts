import {
  mockActivities,
  mockRegistrations,
  mockSettlements,
  mockUsers,
  type Activity,
  type ActivityGalleryItem,
  type Registration,
  type Settlement,
  type User,
} from "@city-social/domain";

export type WaitlistType = "activity" | "juZhang";

export interface CloudActivity extends Activity {
  city: string;
  coverImagePath: string;
  gallery: ActivityGalleryItem[];
  reviewStatus: "approved" | "draft" | "pending" | "rejected";
}

export interface CloudWaitlistEntry {
  id: string;
  activityId: string;
  userId: string;
  type: WaitlistType;
  order: number;
  status: "waiting" | "promoted" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface CloudStore {
  users: User[];
  activities: CloudActivity[];
  registrations: Registration[];
  settlements: Settlement[];
  waitlists: CloudWaitlistEntry[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toMiniProgramImagePath(imagePath: string): string {
  return imagePath.startsWith("/assets/") ? imagePath : `/assets/${imagePath}`;
}

function toCloudActivity(activity: Activity): CloudActivity {
  const gallery = activity.gallery.map((item) => ({
    ...item,
    imagePath: toMiniProgramImagePath(item.imagePath),
  }));

  return {
    ...activity,
    city: "上海",
    coverImagePath: gallery[0]?.imagePath ?? "/assets/images/activity-sushi.jpg",
    gallery,
    reviewStatus: "approved",
  };
}

export function createInMemoryCloudStore(): CloudStore {
  return {
    users: clone(mockUsers),
    activities: clone(mockActivities).map(toCloudActivity),
    registrations: clone(mockRegistrations),
    settlements: clone(mockSettlements),
    waitlists: [],
  };
}

export function copy<T>(value: T): T {
  return clone(value);
}

export function upsertRegistration(store: CloudStore, registration: Registration): Registration {
  const existingIndex = store.registrations.findIndex(
    (item) => item.activityId === registration.activityId && item.userId === registration.userId,
  );

  if (existingIndex >= 0) {
    store.registrations[existingIndex] = registration;
  } else {
    store.registrations.push(registration);
  }

  return copy(registration);
}

export function updateActivity(store: CloudStore, activity: CloudActivity): CloudActivity {
  const existingIndex = store.activities.findIndex((item) => item.id === activity.id);

  if (existingIndex >= 0) {
    store.activities[existingIndex] = activity;
  }

  return copy(activity);
}

export function updateSettlement(store: CloudStore, settlement: Settlement): Settlement {
  const existingIndex = store.settlements.findIndex((item) => item.activityId === settlement.activityId);

  if (existingIndex >= 0) {
    store.settlements[existingIndex] = settlement;
  }

  return copy(settlement);
}

export function createWaitlistEntry(
  store: CloudStore,
  activityId: string,
  userId: string,
  type: WaitlistType,
  now: string,
): CloudWaitlistEntry {
  const existingEntry = store.waitlists.find(
    (entry) => entry.activityId === activityId && entry.userId === userId && entry.type === type,
  );

  if (existingEntry) {
    return copy(existingEntry);
  }

  const order = store.waitlists.filter((entry) => entry.activityId === activityId && entry.type === type).length + 1;
  const entry: CloudWaitlistEntry = {
    id: `w-${activityId}-${type}-${userId}`,
    activityId,
    userId,
    type,
    order,
    status: "waiting",
    createdAt: now,
    updatedAt: now,
  };

  store.waitlists.push(entry);

  return copy(entry);
}
