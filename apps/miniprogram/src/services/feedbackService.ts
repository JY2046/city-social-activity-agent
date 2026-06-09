import { isMutualContact } from "@city-social/domain";

import {
  DEFAULT_CURRENT_USER_ID,
  getMockStore,
  upsertFeedbackEntry,
  type FeedbackEntry,
} from "./mockData";

export interface SubmitFeedbackOptions {
  userId?: string;
  selectedUserIds: string[];
  abnormalText: string;
}

export interface FeedbackCompletionState {
  hasSubmitted: boolean;
  isMutual: boolean;
  contactStateLabel: string;
}

export function submitFeedback(activityId: string, options: SubmitFeedbackOptions): FeedbackEntry {
  const userId = options.userId ?? DEFAULT_CURRENT_USER_ID;

  return upsertFeedbackEntry({
    id: `fb-${activityId}-${userId}`,
    activityId,
    userId,
    selectedUserIds: options.selectedUserIds,
    abnormalText: options.abnormalText,
    createdAt: new Date("2026-06-09T12:00:00+08:00").toISOString(),
  });
}

export function getFeedbackCompletionState(
  activityId: string,
  firstUserId: string,
  secondUserId: string,
): FeedbackCompletionState {
  const activityFeedbackEntries = getMockStore().feedbackEntries.filter((entry) => entry.activityId === activityId);
  const selections = Object.fromEntries(
    activityFeedbackEntries.map((entry) => [entry.userId, entry.selectedUserIds]),
  ) as Record<string, string[]>;
  const hasSubmitted = activityFeedbackEntries.some((entry) => entry.userId === firstUserId);
  const isMutual = isMutualContact(firstUserId, secondUserId, selections);

  return {
    hasSubmitted,
    isMutual,
    contactStateLabel: isMutual ? "已互选，可开放联系" : hasSubmitted ? "已提交反馈" : "等待反馈",
  };
}
