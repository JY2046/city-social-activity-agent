export interface ActivityFeedPage<T> {
  visibleActivities: T[];
  hasMore: boolean;
  nextVisibleCount: number;
}

export function getActivityFeedPage<T>(
  activities: T[],
  visibleCount: number,
  pageSize = 5,
): ActivityFeedPage<T> {
  const safeVisibleCount = Math.max(0, Math.min(visibleCount, activities.length));
  const nextVisibleCount = Math.min(safeVisibleCount + pageSize, activities.length);

  return {
    visibleActivities: activities.slice(0, safeVisibleCount),
    hasMore: safeVisibleCount < activities.length,
    nextVisibleCount,
  };
}
