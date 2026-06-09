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

const templateIdsByPoint: Record<SubscriptionRequestPoint, string[]> = {
  signup: ["activity-reminder-template-id"],
  waitlist: ["waitlist-promotion-template-id"],
  juZhang: ["juzhang-invitation-template-id"],
  feedback: ["feedback-reminder-template-id"],
};

export function getSubscriptionTemplatesForPoint(point: SubscriptionRequestPoint): string[] {
  return templateIdsByPoint[point];
}

export async function requestSubscriptionForPoint(
  point: SubscriptionRequestPoint,
  adapter: NotificationAdapter,
): Promise<SubscriptionRequestResult> {
  const templateIds = getSubscriptionTemplatesForPoint(point);
  const result = await adapter.requestSubscribeMessage({ tmplIds: templateIds });
  const acceptedTemplateIds = templateIds.filter((templateId) => result[templateId] === "accept");

  return {
    point,
    templateIds,
    acceptedTemplateIds,
  };
}
