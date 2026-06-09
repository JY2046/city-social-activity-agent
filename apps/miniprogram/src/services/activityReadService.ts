import { getActivity, listActivities } from "./activityService";
import { cloudGetActivity, cloudListActivities, type ActivityFeedQuery } from "./cloudServices";
import {
  createWeChatCloudAdapter,
  DEFAULT_DATA_SOURCE_MODE,
  isCloudDataSource,
  type CloudCallAdapter,
  type DataSourceMode,
} from "./cloudFunctionClient";
import type { MiniProgramActivity } from "./mockData";

export interface ActivityReadAdapter {
  listActivities: (query?: ActivityFeedQuery) => Promise<MiniProgramActivity[]>;
  getActivity: (activityId: string) => Promise<MiniProgramActivity | undefined>;
}

export type ActivityFeedLoadState =
  | { status: "loading"; activities: MiniProgramActivity[] }
  | { status: "ready"; activities: MiniProgramActivity[] }
  | { status: "empty"; activities: MiniProgramActivity[] }
  | { status: "error"; activities: MiniProgramActivity[]; message: string };

export type ActivityDetailLoadState =
  | { status: "loading"; activity?: MiniProgramActivity }
  | { status: "ready"; activity: MiniProgramActivity }
  | { status: "empty"; activity?: MiniProgramActivity }
  | { status: "error"; activity?: MiniProgramActivity; message: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "活动加载失败";
}

export function createMockActivityReadAdapter(): ActivityReadAdapter {
  return {
    async listActivities() {
      return listActivities();
    },
    async getActivity(activityId) {
      return getActivity(activityId);
    },
  };
}

export function createCloudActivityReadAdapter(
  cloudAdapter: CloudCallAdapter = createWeChatCloudAdapter(),
): ActivityReadAdapter {
  return {
    listActivities(query) {
      return cloudListActivities(cloudAdapter, query);
    },
    getActivity(activityId) {
      return cloudGetActivity(cloudAdapter, activityId);
    },
  };
}

export function createActivityReadAdapter(mode: DataSourceMode = DEFAULT_DATA_SOURCE_MODE): ActivityReadAdapter {
  return isCloudDataSource(mode) ? createCloudActivityReadAdapter() : createMockActivityReadAdapter();
}

export async function loadActivityFeed(
  adapter: ActivityReadAdapter = createActivityReadAdapter(),
  query?: ActivityFeedQuery,
): Promise<ActivityFeedLoadState> {
  try {
    const activities = await adapter.listActivities(query);

    return activities.length > 0 ? { status: "ready", activities } : { status: "empty", activities };
  } catch (error) {
    return {
      status: "error",
      activities: [],
      message: toErrorMessage(error),
    };
  }
}

export async function loadActivityDetail(
  activityId: string,
  adapter: ActivityReadAdapter = createActivityReadAdapter(),
): Promise<ActivityDetailLoadState> {
  try {
    const activity = await adapter.getActivity(activityId);

    return activity ? { status: "ready", activity } : { status: "empty", activity: undefined };
  } catch (error) {
    return {
      status: "error",
      activity: undefined,
      message: toErrorMessage(error),
    };
  }
}
