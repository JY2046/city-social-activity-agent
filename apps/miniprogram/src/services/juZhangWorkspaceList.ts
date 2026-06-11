import type { JuZhangAssignment, Registration } from "@city-social/domain";

import { getJuZhangAssignmentLabel } from "./flowViewModels";
import { DEFAULT_CURRENT_USER_ID, listWaitlistEntries, type MiniProgramActivity, type WaitlistEntry } from "./mockData";
import type { UserActivityItem } from "./userActivityService";

export interface JuZhangWorkspaceListItem {
  activity: MiniProgramActivity;
  registration: Registration;
  statusLabel: string;
  juZhangLabel: string;
  canOpenWorkspace: boolean;
}

function getWorkspaceRegistrationStatusLabel(registration: Registration): string {
  if (registration.status === "waitlisted") {
    return "排队中";
  }

  if (registration.status === "arrived") {
    return "已到场";
  }

  if (registration.status === "noShow") {
    return "无法到场";
  }

  return "已报名";
}

function getJuZhangWaitlistEntry(
  activityId: string,
  userId: string,
  waitlistEntries: WaitlistEntry[],
): WaitlistEntry | undefined {
  return waitlistEntries.find(
    (entry) =>
      entry.activityId === activityId &&
      entry.userId === userId &&
      entry.type === "juZhang" &&
      entry.status === "waiting",
  );
}

function getJuZhangAssignment(activityId: string, assignments: JuZhangAssignment[]): JuZhangAssignment | undefined {
  return assignments.find((assignment) => assignment.activityId === activityId);
}

export function getJuZhangWorkspaceListLabel(
  registration: Registration,
  assignment?: JuZhangAssignment,
  isQueued = false,
  currentUserId = DEFAULT_CURRENT_USER_ID,
): string {
  if (registration.status === "waitlisted") {
    return "活动候补中";
  }

  if (isQueued) {
    return "已在局长候选队列";
  }

  if (assignment?.status === "accepted" && assignment.candidateUserId === currentUserId) {
    return "已是局长";
  }

  if (assignment?.status === "accepted") {
    return registration.willingToBeJuZhang ? "已有局长，可排队" : "未勾选局长";
  }

  if (assignment) {
    return `局长${getJuZhangAssignmentLabel(assignment.status)}`;
  }

  return registration.willingToBeJuZhang ? "可申请局长" : "未勾选局长";
}

export function buildJuZhangWorkspaceItems(
  items: UserActivityItem[],
  options: {
    waitlistEntries?: WaitlistEntry[];
    assignments?: JuZhangAssignment[];
    currentUserId?: string;
  } = {},
): JuZhangWorkspaceListItem[] {
  const waitlistEntries = options.waitlistEntries ?? listWaitlistEntries();
  const assignments = options.assignments ?? [];
  const currentUserId = options.currentUserId ?? DEFAULT_CURRENT_USER_ID;

  return items.map((item) => {
    const isQueued = getJuZhangWaitlistEntry(item.activity.id, item.registration.userId, waitlistEntries) !== undefined;
    const assignment = getJuZhangAssignment(item.activity.id, assignments);

    return {
      activity: item.activity,
      registration: item.registration,
      statusLabel: getWorkspaceRegistrationStatusLabel(item.registration),
      juZhangLabel: getJuZhangWorkspaceListLabel(item.registration, assignment, isQueued, currentUserId),
      canOpenWorkspace: item.registration.status !== "cancelled",
    };
  });
}
