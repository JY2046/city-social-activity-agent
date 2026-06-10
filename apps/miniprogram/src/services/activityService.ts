import { clone } from "./clone";
import { getMockStore, type MiniProgramActivity } from "./mockData";

export function listActivities(): MiniProgramActivity[] {
  return clone(getMockStore().activities);
}

export function getActivity(activityId: string): MiniProgramActivity | undefined {
  const activity = getMockStore().activities.find((item) => item.id === activityId);

  return activity ? clone(activity) : undefined;
}
