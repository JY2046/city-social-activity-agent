import type { Registration, Settlement } from "@city-social/domain";

import { loadActivityDetail, type ActivityReadAdapter } from "./activityReadService";
import {
  cloudConfirmArrival,
  cloudConfirmSettlement,
  cloudJoinWaitlist,
  cloudSignupActivity,
  cloudCancelSignup,
  type SettlementConfirmationInput,
} from "./cloudServices";
import {
  createWeChatCloudAdapter,
  DEFAULT_DATA_SOURCE_MODE,
  isCloudDataSource,
  type CloudCallAdapter,
  type DataSourceMode,
} from "./cloudFunctionClient";
import type { WaitlistEntry, WaitlistType } from "./mockData";
import type { MiniProgramActivity } from "./mockData";
import {
  confirmArrival,
  confirmPayment,
  cancelSignup as cancelMockSignup,
  joinWaitlist,
  signup,
  type ArrivalStatus,
  type SignupOptions,
} from "./registrationService";

export interface RegistrationWriteAdapter {
  signupActivity: (activityId: string, options: SignupOptions) => Promise<Registration>;
  cancelSignup: (activityId: string) => Promise<Registration>;
  joinWaitlist: (activityId: string, type: WaitlistType) => Promise<WaitlistEntry>;
  confirmArrival: (activityId: string, status: ArrivalStatus) => Promise<Registration>;
  confirmPayment: (activityId: string, mode?: SettlementConfirmationInput["mode"]) => Promise<Settlement>;
}

export type SignupWriteState =
  | { status: "ready"; registration: Registration }
  | { status: "error"; message: string };

export type CancelSignupWriteState =
  | { status: "ready"; registration: Registration }
  | { status: "error"; message: string };

export type SignupWriteRefreshState =
  | { status: "ready"; registration: Registration; activity?: MiniProgramActivity; refreshMessage?: string }
  | { status: "error"; message: string };

export type CancelSignupWriteRefreshState =
  | { status: "ready"; registration: Registration; activity?: MiniProgramActivity; refreshMessage?: string }
  | { status: "error"; message: string };

export type WaitlistWriteState =
  | { status: "ready"; waitlistEntry: WaitlistEntry }
  | { status: "error"; message: string };

export type WaitlistWriteRefreshState =
  | { status: "ready"; waitlistEntry: WaitlistEntry; activity?: MiniProgramActivity; refreshMessage?: string }
  | { status: "error"; message: string };

export type ArrivalWriteState =
  | { status: "ready"; registration: Registration }
  | { status: "error"; message: string };

export type PaymentWriteState =
  | { status: "ready"; settlement: Settlement }
  | { status: "error"; message: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "提交失败，请稍后再试";
}

export function createMockRegistrationWriteAdapter(): RegistrationWriteAdapter {
  return {
    async signupActivity(activityId, options) {
      return signup(activityId, options);
    },
    async cancelSignup(activityId) {
      return cancelMockSignup(activityId);
    },
    async joinWaitlist(activityId, type) {
      return joinWaitlist(activityId, type);
    },
    async confirmArrival(activityId, status) {
      return confirmArrival(activityId, status);
    },
    async confirmPayment(activityId, mode = "selfPayToMerchant") {
      if (mode !== "selfPayToMerchant") {
        throw new Error("Mock settlement only supports selfPayToMerchant mode");
      }

      return confirmPayment(activityId);
    },
  };
}

export function createCloudRegistrationWriteAdapter(
  cloudAdapter: CloudCallAdapter = createWeChatCloudAdapter(),
): RegistrationWriteAdapter {
  return {
    signupActivity(activityId, options) {
      return cloudSignupActivity(cloudAdapter, activityId, options);
    },
    cancelSignup(activityId) {
      return cloudCancelSignup(cloudAdapter, activityId);
    },
    joinWaitlist(activityId, type) {
      return cloudJoinWaitlist(cloudAdapter, activityId, type);
    },
    confirmArrival(activityId, status) {
      return cloudConfirmArrival(cloudAdapter, activityId, status);
    },
    confirmPayment(activityId, mode = "selfPayToMerchant") {
      return cloudConfirmSettlement(cloudAdapter, { activityId, mode });
    },
  };
}

export function createRegistrationWriteAdapter(mode: DataSourceMode = DEFAULT_DATA_SOURCE_MODE): RegistrationWriteAdapter {
  return isCloudDataSource(mode) ? createCloudRegistrationWriteAdapter() : createMockRegistrationWriteAdapter();
}

export async function runSignup(
  adapter: RegistrationWriteAdapter,
  activityId: string,
  options: SignupOptions,
): Promise<SignupWriteState> {
  try {
    return {
      status: "ready",
      registration: await adapter.signupActivity(activityId, options),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function runCancelSignup(
  adapter: RegistrationWriteAdapter,
  activityId: string,
): Promise<CancelSignupWriteState> {
  try {
    return {
      status: "ready",
      registration: await adapter.cancelSignup(activityId),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

async function refreshActivity(
  adapter: ActivityReadAdapter,
  activityId: string,
): Promise<{ activity?: MiniProgramActivity; refreshMessage?: string }> {
  const result = await loadActivityDetail(activityId, adapter);

  if (result.status === "ready") {
    return { activity: result.activity };
  }

  if (result.status === "error") {
    return { refreshMessage: result.message };
  }

  return { activity: undefined };
}

export async function runSignupAndRefreshActivity(
  writeAdapter: RegistrationWriteAdapter,
  readAdapter: ActivityReadAdapter,
  activityId: string,
  options: SignupOptions,
): Promise<SignupWriteRefreshState> {
  const signupResult = await runSignup(writeAdapter, activityId, options);

  if (signupResult.status === "error") {
    return signupResult;
  }

  return {
    ...signupResult,
    ...(await refreshActivity(readAdapter, activityId)),
  };
}

export async function runCancelSignupAndRefreshActivity(
  writeAdapter: RegistrationWriteAdapter,
  readAdapter: ActivityReadAdapter,
  activityId: string,
): Promise<CancelSignupWriteRefreshState> {
  const cancelResult = await runCancelSignup(writeAdapter, activityId);

  if (cancelResult.status === "error") {
    return cancelResult;
  }

  return {
    ...cancelResult,
    ...(await refreshActivity(readAdapter, activityId)),
  };
}

export async function runJoinWaitlist(
  adapter: RegistrationWriteAdapter,
  activityId: string,
  type: WaitlistType,
): Promise<WaitlistWriteState> {
  try {
    return {
      status: "ready",
      waitlistEntry: await adapter.joinWaitlist(activityId, type),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function runJoinWaitlistAndRefreshActivity(
  writeAdapter: RegistrationWriteAdapter,
  readAdapter: ActivityReadAdapter,
  activityId: string,
  type: WaitlistType,
): Promise<WaitlistWriteRefreshState> {
  const waitlistResult = await runJoinWaitlist(writeAdapter, activityId, type);

  if (waitlistResult.status === "error") {
    return waitlistResult;
  }

  return {
    ...waitlistResult,
    ...(await refreshActivity(readAdapter, activityId)),
  };
}

export async function runConfirmArrival(
  adapter: RegistrationWriteAdapter,
  activityId: string,
  status: ArrivalStatus,
): Promise<ArrivalWriteState> {
  try {
    return {
      status: "ready",
      registration: await adapter.confirmArrival(activityId, status),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function runConfirmPayment(
  adapter: RegistrationWriteAdapter,
  activityId: string,
  mode: SettlementConfirmationInput["mode"] = "selfPayToMerchant",
): Promise<PaymentWriteState> {
  try {
    return {
      status: "ready",
      settlement: await adapter.confirmPayment(activityId, mode),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}
