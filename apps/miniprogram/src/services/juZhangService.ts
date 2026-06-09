import type { JuZhangAssignment, Registration, Settlement, TopicCard } from "@city-social/domain";

import {
  DEFAULT_CURRENT_USER_ID,
  getMockStore,
  updateSettlement,
  upsertJuZhangAssignment,
  upsertRegistration,
  type MiniProgramActivity,
} from "./mockData";
import type { ArrivalStatus } from "./registrationService";

export interface JuZhangTask {
  title: string;
  description: string;
}

export interface JuZhangWorkspace {
  activity?: MiniProgramActivity;
  assignment?: JuZhangAssignment;
  topicCard?: TopicCard;
  settlement?: Settlement;
  activeRegistrations: Registration[];
  tasks: JuZhangTask[];
}

const tasks: JuZhangTask[] = [
  { title: "开场 & 破冰", description: "借助 AI 话题卡自然开启对话" },
  { title: "活动中协调", description: "关注大家体验，必要时协助沟通" },
  { title: "AA 结算确认", description: "活动后确认每个人的支付状态" },
];

function clone<T>(value: T): T {
  return structuredClone(value);
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

export function getJuZhangWorkspace(activityId: string): JuZhangWorkspace {
  const store = getMockStore();

  return {
    activity: clone(store.activities.find((activity) => activity.id === activityId)),
    assignment: clone(store.juZhangAssignments.find((assignment) => assignment.activityId === activityId)),
    topicCard: clone(store.topicCards.find((topicCard) => topicCard.activityId === activityId)),
    settlement: clone(store.settlements.find((settlement) => settlement.activityId === activityId)),
    activeRegistrations: clone(
      store.registrations.filter(
        (registration) =>
          registration.activityId === activityId &&
          (registration.status === "confirmed" || registration.status === "arrived"),
      ),
    ),
    tasks,
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
