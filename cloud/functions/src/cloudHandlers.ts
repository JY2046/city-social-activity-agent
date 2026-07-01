import type { Registration, Settlement } from "@city-social/domain";

import {
  copy,
  cancelWaitlistEntry,
  createWaitlistEntry,
  type CloudStore,
  type WaitlistType,
  updateActivity,
  updateSettlement,
  upsertRegistration,
} from "./cloudStore";

export interface CloudRequestContext {
  userId: string;
}

export interface CloudFunctionEnvelope<T> {
  ok: boolean;
  code: string;
  message: string;
  data: T;
}

export type ArrivalStatus = "confirmed" | "arrived" | "noShow";
export type SettlementMode = "selfPayToMerchant" | "juZhangCollects" | "free";

export interface ActivityFeedQuery {
  city?: string;
  type?: string;
  keyword?: string;
  budgetType?: string;
}

export interface SignupActivityInput {
  activityId: string;
  willingToBeJuZhang: boolean;
}

export interface CancelRegistrationInput {
  activityId: string;
}

export interface JoinWaitlistInput {
  activityId: string;
  type: WaitlistType;
}

export interface CancelWaitlistInput {
  activityId: string;
  type: WaitlistType;
}

export interface ConfirmArrivalInput {
  activityId: string;
  userId?: string;
  status: ArrivalStatus;
}

export interface ConfirmSettlementInput {
  activityId: string;
  totalAmount?: number;
  participantPaymentStates?: Settlement["paymentStatusByUser"];
  mode: SettlementMode;
}

export interface RespondJuZhangAssignmentInput {
  activityId: string;
  response: "accepted" | "declined";
}

export interface SubmitFeedbackInput {
  activityId: string;
  selectedUserIds: string[];
  abnormalText: string;
}

export interface GetFeedbackCompletionStateInput {
  activityId: string;
  candidateUserId: string;
}

const fixedNow = "2026-06-09T12:00:00.000Z";
const arrivalStatusValues = new Set<ArrivalStatus>(["confirmed", "arrived", "noShow"]);

function ok<T>(data: T): CloudFunctionEnvelope<T> {
  return {
    ok: true,
    code: "OK",
    message: "ok",
    data,
  };
}

function fail(code: string, message: string): CloudFunctionEnvelope<null> {
  return {
    ok: false,
    code,
    message,
    data: null,
  };
}

function getRegistration(store: CloudStore, activityId: string, userId: string): Registration | undefined {
  return store.registrations.find((item) => item.activityId === activityId && item.userId === userId);
}

function isValidArrivalStatus(status: unknown): status is ArrivalStatus {
  return typeof status === "string" && arrivalStatusValues.has(status as ArrivalStatus);
}

export function createCloudHandlers(store: CloudStore) {
  return {
    async listActivities(input: ActivityFeedQuery = {}, _context: CloudRequestContext) {
      const keyword = input.keyword?.trim().toLowerCase();
      const activities = store.activities.filter((activity) => {
        if (activity.reviewStatus !== "approved") {
          return false;
        }

        if (input.city && activity.city !== input.city) {
          return false;
        }

        if (input.type && activity.type !== input.type) {
          return false;
        }

        if (input.budgetType && activity.budgetType !== input.budgetType) {
          return false;
        }

        if (keyword && !`${activity.title} ${activity.area} ${activity.venue}`.toLowerCase().includes(keyword)) {
          return false;
        }

        return true;
      });

      return ok(copy(activities));
    },

    async getActivityDetail(input: { activityId: string }, _context: CloudRequestContext) {
      const activity = store.activities.find((item) => item.id === input.activityId && item.reviewStatus === "approved");

      if (!activity) {
        return fail("ACTIVITY_NOT_FOUND", "Activity not found");
      }

      return ok({ activity: copy(activity) });
    },

    async listMyRegistrations(_input: Record<string, never>, context: CloudRequestContext) {
      return ok(
        copy(
          store.registrations.filter(
            (registration) => registration.userId === context.userId && registration.status !== "cancelled",
          ),
        ),
      );
    },

    async signupActivity(input: SignupActivityInput, context: CloudRequestContext) {
      const activity = store.activities.find((item) => item.id === input.activityId && item.reviewStatus === "approved");

      if (!activity) {
        return fail("ACTIVITY_NOT_FOUND", "Activity not found");
      }

      const existingRegistration = getRegistration(store, input.activityId, context.userId);

      if (existingRegistration && existingRegistration.status !== "cancelled") {
        return ok(copy(existingRegistration));
      }

      if (activity.currentParticipantCount >= activity.capacity) {
        createWaitlistEntry(store, input.activityId, context.userId, "activity", fixedNow);

        return ok(
          upsertRegistration(store, {
            id: `r-${input.activityId}-${context.userId}`,
            activityId: input.activityId,
            userId: context.userId,
            status: "waitlisted",
            willingToBeJuZhang: input.willingToBeJuZhang,
          }),
        );
      }

      const registration = upsertRegistration(store, {
        id: `r-${input.activityId}-${context.userId}`,
        activityId: input.activityId,
        userId: context.userId,
        status: "confirmed",
        willingToBeJuZhang: input.willingToBeJuZhang,
      });

      updateActivity(store, {
        ...activity,
        currentParticipantCount: activity.currentParticipantCount + 1,
        participantIds: [...activity.participantIds, context.userId],
        formationStatus:
          activity.currentParticipantCount + 1 >= activity.capacity ? "formed" : activity.formationStatus,
      });

      const settlement = store.settlements.find((item) => item.activityId === input.activityId);

      if (settlement && settlement.type === "paid") {
        updateSettlement(store, {
          ...settlement,
          participantCount: settlement.participantCount + 1,
          paymentStatusByUser: {
            ...settlement.paymentStatusByUser,
            [context.userId]: false,
          },
        });
      }

      return ok(registration);
    },

    async cancelRegistration(input: CancelRegistrationInput, context: CloudRequestContext) {
      const activity = store.activities.find((item) => item.id === input.activityId && item.reviewStatus === "approved");

      if (!activity) {
        return fail("ACTIVITY_NOT_FOUND", "Activity not found");
      }

      const registration = getRegistration(store, input.activityId, context.userId);

      if (!registration || registration.status === "cancelled") {
        return fail("REGISTRATION_NOT_FOUND", "Active registration not found");
      }

      const wasActive = registration.status !== "waitlisted";
      const cancelledRegistration = upsertRegistration(store, {
        ...registration,
        status: "cancelled",
      });

      if (wasActive) {
        updateActivity(store, {
          ...activity,
          currentParticipantCount: Math.max(activity.currentParticipantCount - 1, 0),
          participantIds: activity.participantIds.filter((participantId) => participantId !== context.userId),
          formationStatus: activity.currentParticipantCount - 1 >= activity.capacity ? activity.formationStatus : "forming",
        });
      }

      const settlement = store.settlements.find((item) => item.activityId === input.activityId);

      if (settlement && settlement.type === "paid" && settlement.paymentStatusByUser[context.userId] !== undefined) {
        const nextPaymentStatusByUser = { ...settlement.paymentStatusByUser };
        delete nextPaymentStatusByUser[context.userId];

        updateSettlement(store, {
          ...settlement,
          participantCount: Math.max(settlement.participantCount - 1, 0),
          paymentStatusByUser: nextPaymentStatusByUser,
        });
      }

      return ok(cancelledRegistration);
    },

    async joinWaitlist(input: JoinWaitlistInput, context: CloudRequestContext) {
      const activity = store.activities.find((item) => item.id === input.activityId && item.reviewStatus === "approved");

      if (!activity) {
        return fail("ACTIVITY_NOT_FOUND", "Activity not found");
      }

      return ok(createWaitlistEntry(store, input.activityId, context.userId, input.type, fixedNow));
    },

    async cancelWaitlist(input: CancelWaitlistInput, context: CloudRequestContext) {
      return ok(cancelWaitlistEntry(store, input.activityId, context.userId, input.type));
    },

    async confirmArrival(input: ConfirmArrivalInput, context: CloudRequestContext) {
      if (!isValidArrivalStatus(input.status)) {
        return fail("INVALID_INPUT", "Invalid arrival status");
      }

      const targetUserId = input.userId ?? context.userId;

      if (targetUserId !== context.userId) {
        return fail("FORBIDDEN", "Forbidden");
      }

      const registration = getRegistration(store, input.activityId, targetUserId);

      if (!registration || registration.status === "waitlisted" || registration.status === "cancelled") {
        return fail("REGISTRATION_NOT_FOUND", "Active registration not found");
      }

      return ok(
        upsertRegistration(store, {
          ...registration,
          status: input.status,
        }),
      );
    },

    async confirmSettlement(input: ConfirmSettlementInput, context: CloudRequestContext) {
      const settlement = store.settlements.find((item) => item.activityId === input.activityId);

      if (!settlement) {
        return fail("SETTLEMENT_NOT_FOUND", "Settlement not found");
      }

      if (settlement.type === "free" || settlement.totalAmount === 0 || input.mode === "free") {
        return ok(copy(settlement));
      }

      if (
        input.participantPaymentStates &&
        Object.keys(input.participantPaymentStates).some((targetUserId) => targetUserId !== context.userId)
      ) {
        return fail("FORBIDDEN", "Forbidden");
      }

      const totalAmount = input.totalAmount ?? settlement.totalAmount;
      const paymentStatusByUser = input.participantPaymentStates
        ? { ...settlement.paymentStatusByUser, ...input.participantPaymentStates }
        : { ...settlement.paymentStatusByUser, [context.userId]: true };

      return ok(
        updateSettlement(store, {
          ...settlement,
          totalAmount,
          paymentStatusByUser,
        }),
      );
    },
  };
}
