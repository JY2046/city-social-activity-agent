import type { JuZhangAssignment, Registration, Settlement, TopicCard } from "@city-social/domain";

import {
  cloudAcceptJuZhang,
  cloudConfirmArrival,
  cloudConfirmSettlement,
  cloudDeclineJuZhang,
  cloudGetJuZhangWorkspace,
} from "./cloudServices";
import { clone } from "./clone";
import {
  createWeChatCloudAdapter,
  DEFAULT_DATA_SOURCE_MODE,
  isCloudDataSource,
  type CloudCallAdapter,
  type DataSourceMode,
} from "./cloudFunctionClient";
import {
  DEFAULT_CURRENT_USER_ID,
  getMockStore,
  updateSettlement,
  upsertJuZhangAssignment,
  upsertRegistration,
  type MiniProgramActivity,
  type WaitlistEntry,
} from "./mockData";
import type { ArrivalStatus } from "./registrationService";

export interface JuZhangTask {
  title: string;
  description: string;
}

export interface JuZhangWorkspace {
  currentUserId: string;
  currentRegistration?: Registration;
  activity?: MiniProgramActivity;
  assignment?: JuZhangAssignment;
  topicCard?: TopicCard;
  settlement?: Settlement;
  juZhangWaitlistEntry?: WaitlistEntry;
  activeRegistrations: Registration[];
  tasks: JuZhangTask[];
}

export interface JuZhangAdapter {
  getWorkspace: (activityId: string) => Promise<JuZhangWorkspace>;
  acceptJuZhang: (activityId: string) => Promise<JuZhangAssignment>;
  declineJuZhang: (activityId: string) => Promise<JuZhangAssignment>;
  confirmParticipantArrival: (activityId: string, participantUserId: string) => Promise<Registration>;
  confirmParticipantPayment: (activityId: string, participantUserId: string) => Promise<Settlement>;
}

export type JuZhangWorkspaceState =
  | { status: "ready"; workspace: JuZhangWorkspace }
  | { status: "error"; message: string };

export type JuZhangAssignmentState =
  | { status: "ready"; assignment: JuZhangAssignment }
  | { status: "error"; message: string };

export type JuZhangArrivalState =
  | { status: "ready"; registration: Registration }
  | { status: "error"; message: string };

export type JuZhangPaymentState =
  | { status: "ready"; settlement: Settlement }
  | { status: "error"; message: string };

const tasks: JuZhangTask[] = [
  { title: "开场 & 破冰", description: "借助 AI 话题卡自然开启对话" },
  { title: "活动中协调", description: "关注大家体验，必要时协助沟通" },
  { title: "AA 结算确认", description: "活动后确认每个人的支付状态" },
];

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "局长操作失败，请稍后再试";
}

function getOrCreateAssignment(activityId: string, userId = DEFAULT_CURRENT_USER_ID): JuZhangAssignment {
  return (
    getMockStore().juZhangAssignments.find(
      (assignment) => assignment.activityId === activityId && assignment.candidateUserId === userId,
    ) ?? {
      id: `jz-${activityId}-${userId}`,
      activityId,
      candidateUserId: userId,
      status: "candidate",
      volunteered: true,
    }
  );
}

function hasActiveCurrentUserRegistration(activityId: string, userId = DEFAULT_CURRENT_USER_ID): boolean {
  return getMockStore().registrations.some(
    (registration) =>
      registration.activityId === activityId &&
      registration.userId === userId &&
      registration.status !== "cancelled",
  );
}

function getCurrentUserRegistration(activityId: string, userId = DEFAULT_CURRENT_USER_ID): Registration | undefined {
  return getMockStore().registrations.find(
    (registration) =>
      registration.activityId === activityId &&
      registration.userId === userId &&
      registration.status !== "cancelled",
  );
}

function getCurrentUserJuZhangWaitlist(activityId: string, userId = DEFAULT_CURRENT_USER_ID): WaitlistEntry | undefined {
  return getMockStore().waitlistEntries.find(
    (entry) =>
      entry.activityId === activityId &&
      entry.userId === userId &&
      entry.type === "juZhang" &&
      entry.status === "waiting",
  );
}

function getCurrentUserAssignment(activityId: string, userId = DEFAULT_CURRENT_USER_ID): JuZhangAssignment | undefined {
  return getMockStore().juZhangAssignments.find(
    (assignment) => assignment.activityId === activityId && assignment.candidateUserId === userId,
  );
}

function emptyWorkspace(): JuZhangWorkspace {
  return {
    activity: undefined,
    currentUserId: DEFAULT_CURRENT_USER_ID,
    currentRegistration: undefined,
    assignment: undefined,
    topicCard: undefined,
    settlement: undefined,
    juZhangWaitlistEntry: undefined,
    activeRegistrations: [],
    tasks: [],
  };
}

export function getJuZhangWorkspace(activityId: string): JuZhangWorkspace {
  const store = getMockStore();

  const currentRegistration = getCurrentUserRegistration(activityId);
  const currentUserAssignment = getCurrentUserAssignment(activityId);
  const juZhangWaitlistEntry = getCurrentUserJuZhangWaitlist(activityId);
  const canManageWorkspace =
    currentRegistration?.willingToBeJuZhang === true ||
    currentUserAssignment !== undefined ||
    juZhangWaitlistEntry !== undefined;

  if (!hasActiveCurrentUserRegistration(activityId)) {
    return emptyWorkspace();
  }

  return {
    activity: clone(store.activities.find((activity) => activity.id === activityId)),
    currentUserId: DEFAULT_CURRENT_USER_ID,
    currentRegistration: clone(currentRegistration),
    assignment: clone(store.juZhangAssignments.find((assignment) => assignment.activityId === activityId)),
    topicCard: clone(store.topicCards.find((topicCard) => topicCard.activityId === activityId)),
    settlement: canManageWorkspace
      ? clone(store.settlements.find((settlement) => settlement.activityId === activityId))
      : undefined,
    juZhangWaitlistEntry: clone(juZhangWaitlistEntry),
    activeRegistrations: canManageWorkspace
      ? clone(
          store.registrations.filter(
            (registration) =>
              registration.activityId === activityId &&
              (registration.status === "confirmed" || registration.status === "arrived"),
          ),
        )
      : [],
    tasks: canManageWorkspace ? tasks : [],
  };
}

export function acceptJuZhang(activityId: string, userId = DEFAULT_CURRENT_USER_ID): JuZhangAssignment {
  return upsertJuZhangAssignment({
    ...getOrCreateAssignment(activityId, userId),
    status: "accepted",
    volunteered: true,
  });
}

export function declineJuZhang(activityId: string, userId = DEFAULT_CURRENT_USER_ID): JuZhangAssignment {
  return upsertJuZhangAssignment({
    ...getOrCreateAssignment(activityId, userId),
    status: "declined",
  });
}

export function confirmParticipantArrival(
  activityId: string,
  participantUserId: string,
  status: ArrivalStatus,
): Registration {
  const registration = getMockStore().registrations.find(
    (item) => item.activityId === activityId && item.userId === participantUserId,
  );

  if (!registration) {
    throw new Error(`Registration not found: ${activityId}/${participantUserId}`);
  }

  return upsertRegistration({
    ...registration,
    status,
  });
}

export function confirmParticipantPayment(activityId: string, participantUserId: string): Settlement {
  const settlement = getMockStore().settlements.find((item) => item.activityId === activityId);

  if (!settlement) {
    throw new Error(`Settlement not found: ${activityId}`);
  }

  if (settlement.type === "free" || settlement.totalAmount === 0) {
    return clone(settlement);
  }

  return updateSettlement({
    ...settlement,
    paymentStatusByUser: {
      ...settlement.paymentStatusByUser,
      [participantUserId]: true,
    },
  });
}

export function createMockJuZhangAdapter(): JuZhangAdapter {
  return {
    async getWorkspace(activityId) {
      return getJuZhangWorkspace(activityId);
    },
    async acceptJuZhang(activityId) {
      return acceptJuZhang(activityId);
    },
    async declineJuZhang(activityId) {
      return declineJuZhang(activityId);
    },
    async confirmParticipantArrival(activityId, participantUserId) {
      return confirmParticipantArrival(activityId, participantUserId, "arrived");
    },
    async confirmParticipantPayment(activityId, participantUserId) {
      return confirmParticipantPayment(activityId, participantUserId);
    },
  };
}

export function createCloudJuZhangAdapter(
  cloudAdapter: CloudCallAdapter = createWeChatCloudAdapter(),
): JuZhangAdapter {
  return {
    getWorkspace(activityId) {
      return cloudGetJuZhangWorkspace(cloudAdapter, activityId);
    },
    acceptJuZhang(activityId) {
      return cloudAcceptJuZhang(cloudAdapter, activityId);
    },
    declineJuZhang(activityId) {
      return cloudDeclineJuZhang(cloudAdapter, activityId);
    },
    confirmParticipantArrival(activityId, participantUserId) {
      return cloudConfirmArrival(cloudAdapter, activityId, "arrived", participantUserId);
    },
    confirmParticipantPayment(activityId, participantUserId) {
      return cloudConfirmSettlement(cloudAdapter, {
        activityId,
        mode: "juZhangCollects",
        participantPaymentStates: { [participantUserId]: true },
      });
    },
  };
}

export function createJuZhangAdapter(mode: DataSourceMode = DEFAULT_DATA_SOURCE_MODE): JuZhangAdapter {
  return isCloudDataSource(mode) ? createCloudJuZhangAdapter() : createMockJuZhangAdapter();
}

export async function runLoadJuZhangWorkspace(
  adapter: JuZhangAdapter,
  activityId: string,
): Promise<JuZhangWorkspaceState> {
  try {
    return { status: "ready", workspace: await adapter.getWorkspace(activityId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function runAcceptJuZhang(
  adapter: JuZhangAdapter,
  activityId: string,
): Promise<JuZhangAssignmentState> {
  try {
    return { status: "ready", assignment: await adapter.acceptJuZhang(activityId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function runDeclineJuZhang(
  adapter: JuZhangAdapter,
  activityId: string,
): Promise<JuZhangAssignmentState> {
  try {
    return { status: "ready", assignment: await adapter.declineJuZhang(activityId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function runConfirmParticipantArrival(
  adapter: JuZhangAdapter,
  activityId: string,
  participantUserId: string,
): Promise<JuZhangArrivalState> {
  try {
    return { status: "ready", registration: await adapter.confirmParticipantArrival(activityId, participantUserId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function runConfirmParticipantPayment(
  adapter: JuZhangAdapter,
  activityId: string,
  participantUserId: string,
): Promise<JuZhangPaymentState> {
  try {
    return { status: "ready", settlement: await adapter.confirmParticipantPayment(activityId, participantUserId) };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
