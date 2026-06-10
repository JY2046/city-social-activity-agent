import type { JuZhangAssignment, Registration, Settlement } from "@city-social/domain";

import type { FeedbackCompletionState, SubmitFeedbackOptions } from "./feedbackService";
import type { JuZhangWorkspace } from "./juZhangService";
import type { FeedbackEntry, MiniProgramActivity, WaitlistEntry, WaitlistType } from "./mockData";
import type { ArrivalStatus, SignupOptions } from "./registrationService";
import { callCloudFunction, type CloudCallAdapter } from "./cloudFunctionClient";

export interface ActivityFeedQuery {
  city?: string;
  type?: MiniProgramActivity["type"];
  keyword?: string;
  budgetType?: MiniProgramActivity["budgetType"];
}

export interface SettlementConfirmationInput {
  activityId: string;
  totalAmount?: number;
  participantPaymentStates?: Settlement["paymentStatusByUser"];
  mode: "selfPayToMerchant" | "juZhangCollects" | "free";
}

export function cloudListActivities(
  adapter: CloudCallAdapter,
  query: ActivityFeedQuery = {},
): Promise<MiniProgramActivity[]> {
  return callCloudFunction<MiniProgramActivity[]>(adapter, "listActivities", query);
}

export async function cloudGetActivity(adapter: CloudCallAdapter, activityId: string): Promise<MiniProgramActivity | undefined> {
  const result = await callCloudFunction<{ activity?: MiniProgramActivity }>(adapter, "getActivityDetail", {
    activityId,
  });

  return result.activity;
}

export function cloudSignupActivity(
  adapter: CloudCallAdapter,
  activityId: string,
  options: SignupOptions,
): Promise<Registration> {
  return callCloudFunction<Registration>(adapter, "signupActivity", {
    activityId,
    willingToBeJuZhang: options.willingToBeJuZhang,
  });
}

export function cloudCancelSignup(adapter: CloudCallAdapter, activityId: string): Promise<Registration> {
  return callCloudFunction<Registration>(adapter, "cancelRegistration", {
    activityId,
  });
}

export function cloudJoinWaitlist(
  adapter: CloudCallAdapter,
  activityId: string,
  type: WaitlistType,
): Promise<WaitlistEntry> {
  return callCloudFunction<WaitlistEntry>(adapter, "joinWaitlist", {
    activityId,
    type,
  });
}

export function cloudConfirmArrival(
  adapter: CloudCallAdapter,
  activityId: string,
  status: ArrivalStatus,
  userId?: string,
): Promise<Registration> {
  return callCloudFunction<Registration>(adapter, "confirmArrival", {
    activityId,
    status,
    userId,
  });
}

export function cloudConfirmSettlement(
  adapter: CloudCallAdapter,
  input: SettlementConfirmationInput,
): Promise<Settlement> {
  return callCloudFunction<Settlement>(adapter, "confirmSettlement", input);
}

export function cloudGetJuZhangWorkspace(adapter: CloudCallAdapter, activityId: string): Promise<JuZhangWorkspace> {
  return callCloudFunction<JuZhangWorkspace>(adapter, "getJuZhangWorkspace", { activityId });
}

export function cloudAcceptJuZhang(adapter: CloudCallAdapter, activityId: string): Promise<JuZhangAssignment> {
  return callCloudFunction<JuZhangAssignment>(adapter, "respondJuZhangAssignment", {
    activityId,
    response: "accepted",
  });
}

export function cloudDeclineJuZhang(adapter: CloudCallAdapter, activityId: string): Promise<JuZhangAssignment> {
  return callCloudFunction<JuZhangAssignment>(adapter, "respondJuZhangAssignment", {
    activityId,
    response: "declined",
  });
}

export function cloudSubmitFeedback(
  adapter: CloudCallAdapter,
  activityId: string,
  options: SubmitFeedbackOptions,
): Promise<FeedbackEntry> {
  return callCloudFunction<FeedbackEntry>(adapter, "submitFeedback", {
    activityId,
    selectedUserIds: options.selectedUserIds,
    abnormalText: options.abnormalText,
  });
}

export function cloudGetFeedbackCompletionState(
  adapter: CloudCallAdapter,
  activityId: string,
  candidateUserId: string,
): Promise<FeedbackCompletionState> {
  return callCloudFunction<FeedbackCompletionState>(adapter, "getFeedbackCompletionState", {
    activityId,
    candidateUserId,
  });
}
