export type DataSourceMode = "mock" | "cloud";

function readDefinedConstant(value: string | undefined): string {
  return typeof value === "string" ? value : "";
}

export const DEFAULT_DATA_SOURCE_MODE: DataSourceMode =
  readDefinedConstant(typeof __CITY_SOCIAL_DATA_SOURCE__ === "undefined" ? undefined : __CITY_SOCIAL_DATA_SOURCE__) ===
  "cloud"
    ? "cloud"
    : "mock";
export const WECHAT_CLOUD_ENV_ID = readDefinedConstant(
  typeof __WECHAT_CLOUD_ENV_ID__ === "undefined" ? undefined : __WECHAT_CLOUD_ENV_ID__,
);

export const cloudFunctionNames = [
  "loginOrCreateUser",
  "listActivities",
  "getActivityDetail",
  "listMyRegistrations",
  "signupActivity",
  "cancelRegistration",
  "joinWaitlist",
  "promoteWaitlist",
  "selectJuZhangCandidate",
  "getJuZhangWorkspace",
  "respondJuZhangAssignment",
  "confirmArrival",
  "createTopicCard",
  "confirmSettlement",
  "submitFeedback",
  "getFeedbackCompletionState",
  "reviewContentSafety",
] as const;

export type CloudFunctionName = (typeof cloudFunctionNames)[number];

export interface CloudFunctionEnvelope<T> {
  ok: boolean;
  code: string;
  message: string;
  data: T;
}

export interface CloudCallInput {
  name: CloudFunctionName;
  data?: unknown;
}

export interface CloudCallResult {
  result?: unknown;
}

export interface CloudCallAdapter {
  callFunction: (input: CloudCallInput) => Promise<CloudCallResult>;
}

export interface WeChatCloudRuntime {
  cloud?: {
    callFunction: (input: CloudCallInput) => Promise<CloudCallResult>;
  };
  wx?: {
    cloud?: {
      callFunction: (input: CloudCallInput) => Promise<CloudCallResult>;
    };
  };
}

export class CloudFunctionError extends Error {
  code: string;
  functionName: CloudFunctionName;

  constructor(functionName: CloudFunctionName, code: string, message: string) {
    super(message);
    this.name = "CloudFunctionError";
    this.code = code;
    this.functionName = functionName;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEnvelope<T>(functionName: CloudFunctionName, result: unknown): CloudFunctionEnvelope<T> {
  if (
    !isRecord(result) ||
    typeof result.ok !== "boolean" ||
    typeof result.code !== "string" ||
    typeof result.message !== "string" ||
    !("data" in result)
  ) {
    throw new CloudFunctionError(functionName, "INVALID_CLOUD_RESPONSE", "Cloud function returned an invalid result");
  }

  return result as CloudFunctionEnvelope<T>;
}

export function getDataSourceMode(mode = DEFAULT_DATA_SOURCE_MODE): DataSourceMode {
  return mode === "cloud" ? "cloud" : "mock";
}

export function isCloudDataSource(mode = DEFAULT_DATA_SOURCE_MODE): boolean {
  return getDataSourceMode(mode) === "cloud";
}

export function createWeChatCloudAdapter(runtime: WeChatCloudRuntime = globalThis as WeChatCloudRuntime): CloudCallAdapter {
  return {
    async callFunction(input) {
      const cloudRuntime = runtime.cloud ?? runtime.wx?.cloud;

      if (!cloudRuntime?.callFunction) {
        throw new CloudFunctionError(input.name, "WECHAT_CLOUD_UNAVAILABLE", "WeChat cloud runtime is not available");
      }

      return cloudRuntime.callFunction(input);
    },
  };
}

export async function callCloudFunction<T>(
  adapter: CloudCallAdapter,
  name: CloudFunctionName,
  data?: unknown,
): Promise<T> {
  const response = await adapter.callFunction({ name, data });
  const envelope = parseEnvelope<T>(name, response.result);

  if (!envelope.ok) {
    throw new CloudFunctionError(name, envelope.code, envelope.message);
  }

  return envelope.data;
}
