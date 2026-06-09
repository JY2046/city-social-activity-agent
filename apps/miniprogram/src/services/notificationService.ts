export type SubscriptionRequestPoint = "signup" | "waitlist" | "juZhang" | "feedback";

export interface RequestSubscribeMessageInput {
  tmplIds: string[];
}

export type SubscribeMessageResult = Record<string, "accept" | "reject" | "ban" | string>;

export interface NotificationAdapter {
  requestSubscribeMessage: (input: RequestSubscribeMessageInput) => Promise<SubscribeMessageResult>;
}

export interface SubscriptionRequestResult {
  point: SubscriptionRequestPoint;
  templateIds: string[];
  acceptedTemplateIds: string[];
}

export type SubscriptionTemplateConfig = Record<SubscriptionRequestPoint, string[]>;

function readRuntimeTemplateConfig(): SubscriptionTemplateConfig {
  const runtimeConfig =
    typeof __WECHAT_SUBSCRIPTION_TEMPLATE_IDS__ === "undefined" ? undefined : __WECHAT_SUBSCRIPTION_TEMPLATE_IDS__;

  return {
    signup: runtimeConfig?.signup ?? [],
    waitlist: runtimeConfig?.waitlist ?? [],
    juZhang: runtimeConfig?.juZhang ?? [],
    feedback: runtimeConfig?.feedback ?? [],
  };
}

function isNotificationAdapter(value: NotificationAdapter | SubscriptionTemplateConfig): value is NotificationAdapter {
  return "requestSubscribeMessage" in value;
}

export function getSubscriptionTemplatesForPoint(
  point: SubscriptionRequestPoint,
  config: SubscriptionTemplateConfig = readRuntimeTemplateConfig(),
): string[] {
  return config[point];
}

export async function requestSubscriptionForPoint(
  point: SubscriptionRequestPoint,
  configOrAdapter: SubscriptionTemplateConfig | NotificationAdapter,
  maybeAdapter?: NotificationAdapter,
): Promise<SubscriptionRequestResult> {
  const config = isNotificationAdapter(configOrAdapter) ? readRuntimeTemplateConfig() : configOrAdapter;
  const adapter = isNotificationAdapter(configOrAdapter) ? configOrAdapter : maybeAdapter;
  const templateIds = getSubscriptionTemplatesForPoint(point, config);

  if (!templateIds.length || !adapter) {
    return {
      point,
      templateIds,
      acceptedTemplateIds: [],
    };
  }

  const result = await adapter.requestSubscribeMessage({ tmplIds: templateIds });
  const acceptedTemplateIds = templateIds.filter((templateId) => result[templateId] === "accept");

  return {
    point,
    templateIds,
    acceptedTemplateIds,
  };
}
