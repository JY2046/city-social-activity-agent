import type { Registration } from "@city-social/domain";

import { clone } from "./clone";
import { createActivityReadAdapter, type ActivityReadAdapter } from "./activityReadService";
import { cloudListMyRegistrations } from "./cloudServices";
import {
  createWeChatCloudAdapter,
  DEFAULT_DATA_SOURCE_MODE,
  isCloudDataSource,
  type CloudCallAdapter,
  type DataSourceMode,
} from "./cloudFunctionClient";
import { DEFAULT_CURRENT_USER_ID, getMockStore, type MiniProgramActivity } from "./mockData";

export interface UserActivityReadAdapter {
  listMyRegistrations: () => Promise<Registration[]>;
  getActivity: (activityId: string) => Promise<MiniProgramActivity | undefined>;
}

export interface UserActivityItem {
  registration: Registration;
  activity: MiniProgramActivity;
}

export type MyRegistrationLoadState =
  | { status: "ready"; registration?: Registration }
  | { status: "error"; message: string };

export type MyActivityFeedLoadState =
  | { status: "ready"; items: UserActivityItem[] }
  | { status: "empty"; items: UserActivityItem[] }
  | { status: "error"; items: UserActivityItem[]; message: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "我的行程加载失败";
}

function isVisibleRegistration(registration: Registration): boolean {
  return registration.status !== "cancelled";
}

export function createMockUserActivityReadAdapter(activityAdapter: ActivityReadAdapter = createActivityReadAdapter("mock")): UserActivityReadAdapter {
  return {
    async listMyRegistrations() {
      return clone(
        getMockStore().registrations.filter(
          (registration) => registration.userId === DEFAULT_CURRENT_USER_ID && isVisibleRegistration(registration),
        ),
      );
    },
    getActivity(activityId) {
      return activityAdapter.getActivity(activityId);
    },
  };
}

export function createCloudUserActivityReadAdapter(
  cloudAdapter: CloudCallAdapter = createWeChatCloudAdapter(),
  activityAdapter: ActivityReadAdapter = createActivityReadAdapter("cloud"),
): UserActivityReadAdapter {
  return {
    listMyRegistrations() {
      return cloudListMyRegistrations(cloudAdapter);
    },
    getActivity(activityId) {
      return activityAdapter.getActivity(activityId);
    },
  };
}

export function createUserActivityReadAdapter(mode: DataSourceMode = DEFAULT_DATA_SOURCE_MODE): UserActivityReadAdapter {
  return isCloudDataSource(mode) ? createCloudUserActivityReadAdapter() : createMockUserActivityReadAdapter();
}

export async function loadMyRegistrationForActivity(
  activityId: string,
  adapter: UserActivityReadAdapter = createUserActivityReadAdapter(),
): Promise<MyRegistrationLoadState> {
  try {
    const registrations = await adapter.listMyRegistrations();

    return {
      status: "ready",
      registration: registrations.find((registration) => registration.activityId === activityId),
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function loadMyActivityFeed(
  adapter: UserActivityReadAdapter = createUserActivityReadAdapter(),
): Promise<MyActivityFeedLoadState> {
  try {
    const registrations = await adapter.listMyRegistrations();
    const items = (
      await Promise.all(
        registrations.map(async (registration) => {
          const activity = await adapter.getActivity(registration.activityId);

          return activity ? { registration, activity } : undefined;
        }),
      )
    )
      .filter((item): item is UserActivityItem => item !== undefined)
      .sort((left, right) => left.activity.startsAt.localeCompare(right.activity.startsAt));

    return items.length > 0 ? { status: "ready", items } : { status: "empty", items };
  } catch (error) {
    return {
      status: "error",
      items: [],
      message: toErrorMessage(error),
    };
  }
}
