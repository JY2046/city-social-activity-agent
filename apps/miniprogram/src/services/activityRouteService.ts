const defaultActivityId = "a-sushi";

export function buildActivityDetailUrl(activityId: string): string {
  return `/pages/activity-detail/index?activityId=${encodeURIComponent(activityId)}`;
}

export function buildSignupUrl(activityId: string): string {
  return `/pages/signup/index?activityId=${encodeURIComponent(activityId)}`;
}

export function buildItineraryDetailUrl(activityId: string): string {
  return `/pages/itinerary-detail/index?activityId=${encodeURIComponent(activityId)}`;
}

export function readActivityIdParam(value: unknown, fallback = defaultActivityId): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
}
