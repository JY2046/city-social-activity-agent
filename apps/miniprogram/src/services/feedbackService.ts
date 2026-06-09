import { isMutualContact } from "@city-social/domain";

import { cloudGetFeedbackCompletionState, cloudSubmitFeedback } from "./cloudServices";
import {
  createWeChatCloudAdapter,
  DEFAULT_DATA_SOURCE_MODE,
  isCloudDataSource,
  type CloudCallAdapter,
  type DataSourceMode,
} from "./cloudFunctionClient";
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

export interface FeedbackAdapter {
  submitFeedback: (activityId: string, options: SubmitFeedbackOptions) => Promise<FeedbackEntry>;
  getCompletionState: (activityId: string, candidateUserId: string) => Promise<FeedbackCompletionState>;
}

export type FeedbackSubmitState =
  | { status: "ready"; feedback: FeedbackEntry }
  | { status: "error"; message: string };

export type FeedbackCompletionLoadState =
  | { status: "ready"; completionState: FeedbackCompletionState }
  | { status: "error"; message: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "反馈提交失败，请稍后再试";
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

export function createMockFeedbackAdapter(): FeedbackAdapter {
  return {
    async submitFeedback(activityId, options) {
      return submitFeedback(activityId, options);
    },
    async getCompletionState(activityId, candidateUserId) {
      return getFeedbackCompletionState(activityId, DEFAULT_CURRENT_USER_ID, candidateUserId);
    },
  };
}

export function createCloudFeedbackAdapter(
  cloudAdapter: CloudCallAdapter = createWeChatCloudAdapter(),
): FeedbackAdapter {
  return {
    submitFeedback(activityId, options) {
      return cloudSubmitFeedback(cloudAdapter, activityId, options);
    },
    getCompletionState(activityId, candidateUserId) {
      return cloudGetFeedbackCompletionState(cloudAdapter, activityId, candidateUserId);
    },
  };
}

export function createFeedbackAdapter(mode: DataSourceMode = DEFAULT_DATA_SOURCE_MODE): FeedbackAdapter {
  return isCloudDataSource(mode) ? createCloudFeedbackAdapter() : createMockFeedbackAdapter();
}

export async function runSubmitFeedback(
  adapter: FeedbackAdapter,
  activityId: string,
  options: SubmitFeedbackOptions,
): Promise<FeedbackSubmitState> {
  try {
    return { status: "ready", feedback: await adapter.submitFeedback(activityId, options) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function runGetFeedbackCompletionState(
  adapter: FeedbackAdapter,
  activityId: string,
  candidateUserId: string,
): Promise<FeedbackCompletionLoadState> {
  try {
    return { status: "ready", completionState: await adapter.getCompletionState(activityId, candidateUserId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
