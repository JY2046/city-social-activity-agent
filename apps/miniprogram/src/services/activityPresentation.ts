import type { ActivityType } from "@city-social/domain";

import type { MiniProgramActivity } from "./mockData";

const typeLabels: Record<ActivityType, string> = {
  dinner: "饭局",
  coffee: "咖啡",
  bar: "酒吧",
  walk: "免费散步",
};

const statusLabels: Record<MiniProgramActivity["formationStatus"], string> = {
  forming: "报名中",
  nearly_full: "快满员",
  formed: "已成局",
  ongoing: "进行中",
  ended: "已结束",
  cancelled: "已取消",
};

export function getActivityTypeLabel(type: ActivityType): string {
  return typeLabels[type];
}

export function getActivityStatusLabel(activity: MiniProgramActivity): string {
  return statusLabels[activity.formationStatus];
}

export function getCostLabel(activity: MiniProgramActivity): string {
  if (activity.budgetType === "free" || activity.estimatedCost === 0) {
    return "免费";
  }

  return `约 ${activity.estimatedCost} 元`;
}

export function getActivityCtaLabel(activity: MiniProgramActivity): string {
  if (activity.currentParticipantCount >= activity.capacity && activity.formationStatus !== "ended") {
    return "排队候补";
  }

  if (activity.formationStatus === "formed" || activity.formationStatus === "ongoing") {
    return "查看活动";
  }

  return "报名加入";
}

export function formatActivityDateTime(startsAt: string): string {
  const date = new Date(startsAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${month}月${day}日 ${hour}:${minute}`;
}
