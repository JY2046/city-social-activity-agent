import type { Registration } from "@city-social/domain";

import { clone } from "./clone";
import {
  createWaitlistEntry,
  cancelWaitlistEntry,
  DEFAULT_CURRENT_USER_ID,
  getMockStore,
  resetMockStore,
  updateActivity,
  updateSettlement,
  upsertRegistration,
  type WaitlistEntry,
  type WaitlistType,
} from "./mockData";

export interface SignupOptions {
  userId?: string;
  willingToBeJuZhang: boolean;
}

export type ArrivalStatus = "confirmed" | "arrived" | "noShow";

function getUserId(userId?: string): string {
  return userId ?? DEFAULT_CURRENT_USER_ID;
}

function getRegistration(activityId: string, userId: string): Registration | undefined {
  return getMockStore().registrations.find(
    (registration) => registration.activityId === activityId && registration.userId === userId,
  );
}

export function resetMockServices(): void {
  resetMockStore();
}

export function signup(activityId: string, options: SignupOptions): Registration {
  const store = getMockStore();
  const activity = store.activities.find((item) => item.id === activityId);
  const userId = getUserId(options.userId);

  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  const existingRegistration = getRegistration(activityId, userId);

  if (existingRegistration && existingRegistration.status !== "cancelled") {
    return clone(existingRegistration);
  }

  if (activity.currentParticipantCount >= activity.capacity) {
    createWaitlistEntry(activityId, userId, "activity");

    return upsertRegistration({
      id: `r-${activityId}-${userId}`,
      activityId,
      userId,
      status: "waitlisted",
      willingToBeJuZhang: options.willingToBeJuZhang,
    });
  }

  const registration = upsertRegistration({
    id: `r-${activityId}-${userId}`,
    activityId,
    userId,
    status: "confirmed",
    willingToBeJuZhang: options.willingToBeJuZhang,
  });

  updateActivity({
    ...activity,
    currentParticipantCount: activity.currentParticipantCount + 1,
    participantIds: [...activity.participantIds, userId],
    formationStatus:
      activity.currentParticipantCount + 1 >= activity.capacity ? "formed" : activity.formationStatus,
  });

  const settlement = store.settlements.find((item) => item.activityId === activityId);

  if (settlement && settlement.type === "paid") {
    updateSettlement({
      ...settlement,
      participantCount: settlement.participantCount + 1,
      paymentStatusByUser: {
        ...settlement.paymentStatusByUser,
        [userId]: false,
      },
    });
  }

  return registration;
}

export function cancelSignup(activityId: string, userId?: string): Registration {
  const store = getMockStore();
  const activity = store.activities.find((item) => item.id === activityId);
  const targetUserId = getUserId(userId);
  const registration = getRegistration(activityId, targetUserId);

  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  if (!registration || registration.status === "cancelled") {
    throw new Error(`Active registration not found for ${activityId}`);
  }

  const wasActive = registration.status !== "waitlisted";
  const cancelledRegistration = upsertRegistration({
    ...registration,
    status: "cancelled",
  });

  if (wasActive) {
    updateActivity({
      ...activity,
      currentParticipantCount: Math.max(activity.currentParticipantCount - 1, 0),
      participantIds: activity.participantIds.filter((participantId) => participantId !== targetUserId),
      formationStatus:
        activity.currentParticipantCount - 1 >= activity.capacity ? activity.formationStatus : "forming",
    });
  }

  const settlement = store.settlements.find((item) => item.activityId === activityId);

  if (settlement && settlement.type === "paid" && settlement.paymentStatusByUser[targetUserId] !== undefined) {
    const nextPaymentStatusByUser = { ...settlement.paymentStatusByUser };
    delete nextPaymentStatusByUser[targetUserId];

    updateSettlement({
      ...settlement,
      participantCount: Math.max(settlement.participantCount - 1, 0),
      paymentStatusByUser: nextPaymentStatusByUser,
    });
  }

  return cancelledRegistration;
}

export function joinWaitlist(activityId: string, type: WaitlistType, userId?: string): WaitlistEntry {
  const activity = getMockStore().activities.find((item) => item.id === activityId);

  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  return createWaitlistEntry(activityId, getUserId(userId), type);
}

export function cancelWaitlist(activityId: string, type: WaitlistType, userId?: string): WaitlistEntry {
  return cancelWaitlistEntry(activityId, getUserId(userId), type);
}

export function confirmArrival(activityId: string, arrivalStatus: ArrivalStatus, userId?: string): Registration {
  const targetUserId = getUserId(userId);
  const registration = getRegistration(activityId, targetUserId);

  if (!registration || registration.status === "waitlisted" || registration.status === "cancelled") {
    throw new Error(`Active registration not found for ${activityId}`);
  }

  return upsertRegistration({
    ...registration,
    status: arrivalStatus,
  });
}

export function confirmPayment(activityId: string, userId?: string) {
  const settlement = getMockStore().settlements.find((item) => item.activityId === activityId);
  const targetUserId = getUserId(userId);

  if (!settlement) {
    throw new Error(`Settlement not found: ${activityId}`);
  }

  if (settlement.type === "free" || settlement.totalAmount === 0) {
    return clone(settlement);
  }

  return updateSettlement({
    ...settlement,
    paymentStatusByUser: {
      ...settlement.paymentStatusByUser,
      [targetUserId]: true,
    },
  });
}
