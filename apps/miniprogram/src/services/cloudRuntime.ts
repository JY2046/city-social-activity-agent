import { WECHAT_CLOUD_ENV_ID } from "./cloudFunctionClient";

export interface CloudInitRuntime {
  cloud?: {
    init: (options: { env: string; traceUser: boolean }) => void;
  };
  wx?: {
    cloud?: {
      init: (options: { env: string; traceUser: boolean }) => void;
    };
  };
}

export interface CloudInitResult {
  initialized: boolean;
  reason: "initialized" | "missing_env_id" | "cloud_unavailable";
}

export function initCloudRuntime(
  runtime: CloudInitRuntime = globalThis as CloudInitRuntime,
  envId = WECHAT_CLOUD_ENV_ID,
): CloudInitResult {
  if (!envId) {
    return {
      initialized: false,
      reason: "missing_env_id",
    };
  }

  const cloudRuntime = runtime.cloud ?? runtime.wx?.cloud;

  if (!cloudRuntime?.init) {
    return {
      initialized: false,
      reason: "cloud_unavailable",
    };
  }

  cloudRuntime.init({
    env: envId,
    traceUser: true,
  });

  return {
    initialized: true,
    reason: "initialized",
  };
}
