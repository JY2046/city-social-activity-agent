import type {
  ActivityFeedQuery,
  CancelRegistrationInput,
  CancelWaitlistInput,
  CloudFunctionEnvelope,
  CloudRequestContext,
  ConfirmArrivalInput,
  ConfirmSettlementInput,
  GetFeedbackCompletionStateInput,
  JoinWaitlistInput,
  RespondJuZhangAssignmentInput,
  SignupActivityInput,
  SubmitFeedbackInput,
} from "./cloudHandlers";
import type { createCloudDatabaseAdapter } from "./cloudDatabaseAdapter";

export type CloudDatabaseAdapter = ReturnType<typeof createCloudDatabaseAdapter>;

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

function toFailureEnvelope(error: unknown): CloudFunctionEnvelope<null> {
  const message = error instanceof Error ? error.message : "Cloud database operation failed";

  if (message === "Activity not found") {
    return fail("ACTIVITY_NOT_FOUND", message);
  }

  if (message === "Active registration not found") {
    return fail("REGISTRATION_NOT_FOUND", message);
  }

  if (message === "Settlement not found") {
    return fail("SETTLEMENT_NOT_FOUND", message);
  }

  if (message === "Forbidden") {
    return fail("FORBIDDEN", message);
  }

  if (message.startsWith("Invalid ")) {
    return fail("INVALID_INPUT", message);
  }

  return fail("DATABASE_OPERATION_FAILED", message);
}

async function run<T>(operation: () => Promise<T>): Promise<CloudFunctionEnvelope<T> | CloudFunctionEnvelope<null>> {
  try {
    return ok(await operation());
  } catch (error) {
    return toFailureEnvelope(error);
  }
}

export function createCloudDatabaseHandlers(adapter: CloudDatabaseAdapter) {
  return {
    listActivities(input: ActivityFeedQuery = {}, _context: CloudRequestContext) {
      return run(() => adapter.listActivities(input));
    },

    async getActivityDetail(input: { activityId: string }, _context: CloudRequestContext) {
      const activity = await adapter.getActivity(input.activityId);

      return activity ? ok({ activity }) : fail("ACTIVITY_NOT_FOUND", "Activity not found");
    },

    listMyRegistrations(_input: Record<string, never>, context: CloudRequestContext) {
      return run(() => adapter.listMyRegistrations(context.userId));
    },

    signupActivity(input: SignupActivityInput, context: CloudRequestContext) {
      return run(() => adapter.signupActivity(input, context.userId));
    },

    cancelRegistration(input: CancelRegistrationInput, context: CloudRequestContext) {
      return run(() => adapter.cancelRegistration(input, context.userId));
    },

    joinWaitlist(input: JoinWaitlistInput, context: CloudRequestContext) {
      return run(() => adapter.joinWaitlist(input, context.userId));
    },

    cancelWaitlist(input: CancelWaitlistInput, context: CloudRequestContext) {
      return run(() => adapter.cancelWaitlist(input, context.userId));
    },

    confirmArrival(input: ConfirmArrivalInput, context: CloudRequestContext) {
      return run(() => adapter.confirmArrival(input, context.userId));
    },

    confirmSettlement(input: ConfirmSettlementInput, context: CloudRequestContext) {
      return run(() => adapter.confirmSettlement(input, context.userId));
    },

    getJuZhangWorkspace(input: { activityId: string }, context: CloudRequestContext) {
      return run(() => adapter.getJuZhangWorkspace(input.activityId, context.userId));
    },

    respondJuZhangAssignment(input: RespondJuZhangAssignmentInput, context: CloudRequestContext) {
      return run(() => adapter.respondJuZhangAssignment(input, context.userId));
    },

    submitFeedback(input: SubmitFeedbackInput, context: CloudRequestContext) {
      return run(() => adapter.submitFeedback(input, context.userId));
    },

    getFeedbackCompletionState(input: GetFeedbackCompletionStateInput, context: CloudRequestContext) {
      return run(() => adapter.getFeedbackCompletionState(input, context.userId));
    },
  };
}
