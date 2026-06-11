export type ItineraryListState =
  | { mode: "loading"; title: string; copy: string }
  | { mode: "empty"; title: string; copy: string }
  | { mode: "ready" };

export function getItineraryListState(isLoading: boolean, items: unknown[]): ItineraryListState {
  if (isLoading) {
    return {
      mode: "loading",
      title: "正在加载行程",
      copy: "正在同步你已报名的小局。",
    };
  }

  if (items.length === 0) {
    return {
      mode: "empty",
      title: "还没有报名的小局",
      copy: "去发现页挑一个感兴趣的活动，报名后会出现在这里。",
    };
  }

  return { mode: "ready" };
}

export function getItineraryDetailTitle(activity: { title: string } | undefined, isLoading: boolean): string {
  if (activity) {
    return activity.title;
  }

  return isLoading ? "行程加载中" : "活动不存在";
}
