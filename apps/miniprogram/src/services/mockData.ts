import {
  mockActivities,
  mockJuZhangAssignments,
  mockRegistrations,
  mockSettlements,
  mockTopicCards,
  mockUsers,
  type Activity,
  type ActivityGalleryItem,
  type JuZhangAssignment,
  type Registration,
  type Settlement,
  type TopicCard,
  type User,
} from "@city-social/domain";

import { clone } from "./clone";

export const DEFAULT_CURRENT_USER_ID = "u-current";

export type WaitlistType = "activity" | "juZhang";

export interface MiniProgramActivity extends Activity {
  coverImagePath: string;
  gallery: ActivityGalleryItem[];
}

export interface WaitlistEntry {
  id: string;
  activityId: string;
  userId: string;
  type: WaitlistType;
  order: number;
  status: "waiting" | "promoted" | "cancelled";
}

export interface FeedbackEntry {
  id: string;
  activityId: string;
  userId: string;
  selectedUserIds: string[];
  abnormalText: string;
  createdAt: string;
}

export interface MockStore {
  users: User[];
  activities: MiniProgramActivity[];
  registrations: Registration[];
  juZhangAssignments: JuZhangAssignment[];
  settlements: Settlement[];
  topicCards: TopicCard[];
  waitlistEntries: WaitlistEntry[];
  feedbackEntries: FeedbackEntry[];
}

const currentUser: User = {
  id: DEFAULT_CURRENT_USER_ID,
  nickname: "Lily",
  avatar: "L",
  interests: ["饭局", "咖啡", "城市散步"],
  bio: "正在体验小程序冷启动版本。",
  reputationLevel: "可信参与者",
  attendedEventCount: 5,
  showAttendedEventCount: true,
  badges: ["准时到场"],
  canBeJuZhang: true,
};

function toMiniProgramImagePath(imagePath: string): string {
  return `/assets/${imagePath}`;
}

function toMiniProgramActivity(activity: Activity): MiniProgramActivity {
  const gallery = activity.gallery.map((item) => ({
    ...item,
    imagePath: toMiniProgramImagePath(item.imagePath),
  }));

  return {
    ...activity,
    gallery,
    coverImagePath: gallery[0]?.imagePath ?? "/assets/images/activity-sushi.jpg",
  };
}

function createInitialStore(): MockStore {
  return {
    users: [...clone(mockUsers), currentUser],
    activities: clone(mockActivities).map(toMiniProgramActivity),
    registrations: clone(mockRegistrations),
    juZhangAssignments: clone(mockJuZhangAssignments),
    settlements: clone(mockSettlements),
    topicCards: clone(mockTopicCards),
    waitlistEntries: [],
    feedbackEntries: [],
  };
}

let store = createInitialStore();

export function resetMockStore(): MockStore {
  store = createInitialStore();

  return getMockStore();
}

export function getMockStore(): MockStore {
  return store;
}

export function getUserDisplayName(userId: string): string {
  return store.users.find((user) => user.id === userId)?.nickname ?? "匿名参与者";
}

export function listWaitlistEntries(): WaitlistEntry[] {
  return clone(store.waitlistEntries);
}

export function getSettlementByActivityId(activityId: string): Settlement | undefined {
  const settlement = store.settlements.find((item) => item.activityId === activityId);

  return settlement ? clone(settlement) : undefined;
}

export function createWaitlistEntry(activityId: string, userId: string, type: WaitlistType): WaitlistEntry {
  const existingIndex = store.waitlistEntries.findIndex(
    (entry) => entry.activityId === activityId && entry.userId === userId && entry.type === type,
  );

  if (existingIndex >= 0) {
    store.waitlistEntries[existingIndex] = {
      ...store.waitlistEntries[existingIndex],
      status: "waiting",
    };

    return clone(store.waitlistEntries[existingIndex]);
  }

  const order =
    store.waitlistEntries.filter((entry) => entry.activityId === activityId && entry.type === type).length + 1;
  const entry: WaitlistEntry = {
    id: `w-${activityId}-${type}-${userId}`,
    activityId,
    userId,
    type,
    order,
    status: "waiting",
  };

  store.waitlistEntries.push(entry);

  return clone(entry);
}

export function cancelWaitlistEntry(activityId: string, userId: string, type: WaitlistType): WaitlistEntry {
  const existingIndex = store.waitlistEntries.findIndex(
    (entry) =>
      entry.activityId === activityId &&
      entry.userId === userId &&
      entry.type === type &&
      entry.status === "waiting",
  );

  if (existingIndex < 0) {
    throw new Error(`Active waitlist entry not found for ${activityId}`);
  }

  store.waitlistEntries[existingIndex] = {
    ...store.waitlistEntries[existingIndex],
    status: "cancelled",
  };

  return clone(store.waitlistEntries[existingIndex]);
}

export function upsertRegistration(registration: Registration): Registration {
  const existingIndex = store.registrations.findIndex(
    (item) => item.activityId === registration.activityId && item.userId === registration.userId,
  );

  if (existingIndex >= 0) {
    store.registrations[existingIndex] = registration;
  } else {
    store.registrations.push(registration);
  }

  return clone(registration);
}

export function updateActivity(activity: MiniProgramActivity): MiniProgramActivity {
  const existingIndex = store.activities.findIndex((item) => item.id === activity.id);

  if (existingIndex >= 0) {
    store.activities[existingIndex] = activity;
  }

  return clone(activity);
}

export function updateSettlement(settlement: Settlement): Settlement {
  const existingIndex = store.settlements.findIndex((item) => item.activityId === settlement.activityId);

  if (existingIndex >= 0) {
    store.settlements[existingIndex] = settlement;
  }

  return clone(settlement);
}

export function upsertJuZhangAssignment(assignment: JuZhangAssignment): JuZhangAssignment {
  const existingIndex = store.juZhangAssignments.findIndex(
    (item) => item.activityId === assignment.activityId && item.candidateUserId === assignment.candidateUserId,
  );

  if (existingIndex >= 0) {
    store.juZhangAssignments[existingIndex] = assignment;
  } else {
    store.juZhangAssignments.push(assignment);
  }

  return clone(assignment);
}

export function upsertFeedbackEntry(feedbackEntry: FeedbackEntry): FeedbackEntry {
  const existingIndex = store.feedbackEntries.findIndex(
    (item) => item.activityId === feedbackEntry.activityId && item.userId === feedbackEntry.userId,
  );

  if (existingIndex >= 0) {
    store.feedbackEntries[existingIndex] = feedbackEntry;
  } else {
    store.feedbackEntries.push(feedbackEntry);
  }

  return clone(feedbackEntry);
}
