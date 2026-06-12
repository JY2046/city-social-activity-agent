import type {
  FormationStatus,
  JuZhangAssignment,
  JuZhangStatus,
  Registration,
  RegistrationStatus,
  Settlement,
} from "@city-social/domain";

import type { ArrivalStatus } from "./registrationService";
import type { WaitlistType } from "./mockData";

export interface ArrivalOption {
  status: ArrivalStatus;
  label: string;
  description: string;
}

export interface SignupViewState {
  title: string;
  message: string;
  showJuZhangTaskEntry: boolean;
}

export interface SignupPrimaryActionState {
  label: string;
  isCompleted: boolean;
}

export interface ActivityDetailPrimaryActionState {
  label: string;
  isCompleted: boolean;
  variant?: "completed" | "queued";
}

export interface JuZhangSettlementRow {
  userId: string;
  displayName: string;
  participantPaymentLabel: string;
  juZhangActionLabel: string;
  canConfirm: boolean;
}

export interface JuZhangBannerInput {
  assignment?: JuZhangAssignment;
  currentUserId: string;
  currentRegistration?: Registration;
  isQueued?: boolean;
}

export interface JuZhangBannerState {
  title: string;
  copy: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  mode: "respond" | "accepted" | "declined" | "queue" | "queued" | "none";
}

export type ActivityFlowPhase = "before" | "during" | "after";

export interface ItineraryStageState {
  showBeforeInfo: boolean;
  showJuZhangApplication: boolean;
  showArrivalSync: boolean;
  showPayment: boolean;
  showFeedback: boolean;
}

export interface JuZhangStageState {
  showBeforeInfo: boolean;
  showTaskCards: boolean;
  showTopicCard: boolean;
  showArrivalCheck: boolean;
  showSettlement: boolean;
  showAfterFeedback: boolean;
}

export interface JuZhangQueueActionState {
  copy: string;
  label: string;
  disabled: boolean;
  mode: "available" | "queued" | "accepted" | "unavailable";
}

const arrivalOptions: ArrivalOption[] = [
  { status: "arrived", label: "我会准时到", description: "活动前 30 分钟同步给局长" },
  { status: "confirmed", label: "可能迟到", description: "局长会看到你的状态" },
  { status: "noShow", label: "无法到场", description: "系统会记录并提示风险" },
];

const registrationStatusLabels: Record<RegistrationStatus, string> = {
  registered: "已报名",
  waitlisted: "排队中",
  cancelled: "已取消",
  confirmed: "已确认",
  arrived: "已到场",
  completed: "已完成",
  noShow: "未到场",
};

const juZhangAssignmentLabels: Record<JuZhangStatus, string> = {
  candidate: "候选中",
  invited: "待确认",
  accepted: "已接受",
  declined: "已拒绝",
  active: "进行中",
  completed: "已完成",
  withdrawn: "已退出",
  replaced: "已替换",
};

export function getActivityFlowPhase(activity: { formationStatus: FormationStatus }): ActivityFlowPhase {
  if (activity.formationStatus === "ongoing") {
    return "during";
  }

  if (activity.formationStatus === "ended" || activity.formationStatus === "cancelled") {
    return "after";
  }

  return "before";
}

export function resolveActivityFlowPhase(
  activity: { formationStatus: FormationStatus },
  debugOverride?: ActivityFlowPhase,
): ActivityFlowPhase {
  return debugOverride ?? getActivityFlowPhase(activity);
}

export function getItineraryStageState(phase: ActivityFlowPhase): ItineraryStageState {
  return {
    showBeforeInfo: phase === "before",
    showJuZhangApplication: phase === "before",
    showArrivalSync: phase === "during",
    showPayment: phase === "during",
    showFeedback: phase === "after",
  };
}

export function getJuZhangStageState(phase: ActivityFlowPhase): JuZhangStageState {
  return {
    showBeforeInfo: phase === "before",
    showTaskCards: phase === "during",
    showTopicCard: phase === "during",
    showArrivalCheck: phase === "during",
    showSettlement: phase === "during",
    showAfterFeedback: phase === "after",
  };
}

export function getJuZhangQueueActionState(
  registration: Registration | undefined,
  isQueued: boolean,
  assignment?: JuZhangAssignment,
  currentUserId = "",
): JuZhangQueueActionState {
  if (assignment?.status === "accepted" && assignment.candidateUserId === currentUserId) {
    return {
      copy: "你已是本场小局局长，活动开始前系统会继续给任务提示。",
      label: "已担任局长",
      disabled: true,
      mode: "accepted",
    };
  }

  if (isQueued) {
    return {
      copy: "你已在局长候选队列，可随时取消排队。",
      label: "取消局长排队",
      disabled: false,
      mode: "queued",
    };
  }

  if (registration?.willingToBeJuZhang !== true) {
    return {
      copy: "你报名时没有勾选愿意担任局长，因此不会进入候选队列。",
      label: "未勾选局长",
      disabled: true,
      mode: "unavailable",
    };
  }

  return {
    copy: "如果该活动已有局长，会进入候选队列。",
    label: "申请局长",
    disabled: false,
    mode: "available",
  };
}

export function shouldShowJuZhangTasks(registration?: Registration): boolean {
  return registration?.status === "confirmed" && registration.willingToBeJuZhang;
}

export function getSignupViewState(registration?: Registration): SignupViewState {
  if (!registration) {
    return {
      title: "确认报名",
      message: "勾选规则后即可加入活动。",
      showJuZhangTaskEntry: false,
    };
  }

  if (registration.status === "waitlisted") {
    return {
      title: "已加入候补",
      message: "活动满员时会先进入候补队列，有名额会提醒你。",
      showJuZhangTaskEntry: false,
    };
  }

  if (registration.status === "cancelled") {
    return {
      title: "已取消报名",
      message: "你已退出这个小局，想再加入时可以重新确认报名。",
      showJuZhangTaskEntry: false,
    };
  }

  return {
    title: "报名成功",
    message: registration.willingToBeJuZhang
      ? "已勾选愿意担任局长，系统会在活动前 24 小时内确认。"
      : "你已完成普通报名，不会显示局长任务。",
    showJuZhangTaskEntry: shouldShowJuZhangTasks(registration),
  };
}

export function getSignupPrimaryActionState(registration?: Registration): SignupPrimaryActionState {
  if (
    registration?.status === "confirmed" ||
    registration?.status === "arrived" ||
    registration?.status === "waitlisted"
  ) {
    return {
      label: "已报名",
      isCompleted: true,
    };
  }

  return {
    label: "确认报名",
    isCompleted: false,
  };
}

export function getActivityDetailPrimaryActionState(registration?: Registration): ActivityDetailPrimaryActionState {
  if (registration?.status === "waitlisted") {
    return {
      label: "排队中",
      isCompleted: false,
      variant: "queued",
    };
  }

  if (registration?.status === "confirmed" || registration?.status === "arrived") {
    return {
      label: "已报名",
      isCompleted: true,
      variant: "completed",
    };
  }

  return {
    label: "确认报名",
    isCompleted: false,
  };
}

export function getArrivalOptions(): ArrivalOption[] {
  return arrivalOptions;
}

export function getRegistrationStatusLabel(status: RegistrationStatus): string {
  return registrationStatusLabels[status];
}

export function getJuZhangAssignmentLabel(status: JuZhangStatus): string {
  return juZhangAssignmentLabels[status];
}

export function getJuZhangBannerState({
  assignment,
  currentUserId,
  currentRegistration,
  isQueued = false,
}: JuZhangBannerInput): JuZhangBannerState {
  const isCurrentUserAssigned = assignment?.candidateUserId === currentUserId;
  const canEnterJuZhangQueue = currentRegistration?.willingToBeJuZhang === true || isQueued || isCurrentUserAssigned;

  if (!canEnterJuZhangQueue) {
    return {
      title: "暂无局长权限",
      copy: "你报名时没有勾选愿意担任局长，因此不会进入局长候选队列。",
      mode: "none",
    };
  }

  if (assignment?.status === "accepted" && assignment.candidateUserId !== currentUserId) {
    return {
      title: "当前状态：已有局长",
      copy: "这个小局已经有局长，你可以加入候选排队；如果当前局长退出，系统会按顺序提醒。",
      primaryLabel: isQueued ? "取消局长排队" : "加入局长排队",
      mode: isQueued ? "queued" : "queue",
    };
  }

  if (assignment?.status === "accepted") {
    return {
      title: "当前状态：已接受局长",
      copy: "系统会继续给你任务提示，活动中按步骤协助大家即可。",
      mode: "accepted",
    };
  }

  if (assignment?.status === "declined") {
    return {
      title: "当前状态：已拒绝局长",
      copy: "你仍然保留活动报名；如果之后想参与候选，可以加入局长排队。",
      primaryLabel: isQueued ? "取消局长排队" : "加入局长排队",
      mode: isQueued ? "queued" : "queue",
    };
  }

  return {
    title: `当前状态：${getJuZhangAssignmentLabel(assignment?.status ?? "candidate")}`,
    copy: "可接受或拒绝局长身份，拒绝不会退出活动。",
    primaryLabel: "接受局长",
    secondaryLabel: "拒绝",
    mode: "respond",
  };
}

export function getPaymentActionLabel(settlement: Settlement | undefined, userId: string): string {
  if (!settlement || settlement.type === "free" || settlement.totalAmount === 0) {
    return "本活动免费";
  }

  return settlement.paymentStatusByUser[userId] ? "已完成支付" : "确认已支付";
}

export function getJuZhangSettlementRows(
  settlement: Settlement | undefined,
  getDisplayName: (userId: string) => string = (userId) => userId,
  confirmedUserIds: string[] = [],
): JuZhangSettlementRow[] {
  if (!settlement || settlement.type === "free" || settlement.totalAmount === 0) {
    return [];
  }

  const confirmedUserIdSet = new Set(confirmedUserIds);

  return Object.entries(settlement.paymentStatusByUser).map(([userId, hasPaid]) => ({
    userId,
    displayName: getDisplayName(userId),
    participantPaymentLabel: hasPaid ? "用户已支付" : "用户未支付",
    juZhangActionLabel: confirmedUserIdSet.has(userId) ? "已支付" : hasPaid ? "局长确认" : "等待支付",
    canConfirm: hasPaid && !confirmedUserIdSet.has(userId),
  }));
}

export function getWaitlistTitle(type: WaitlistType): string {
  return type === "juZhang" ? "局长候选排队中" : "活动候补中";
}

export function getWaitlistDescription(type: WaitlistType): string {
  return type === "juZhang"
    ? "该活动已有局长，你已进入候选队列；如果当前局长退出，系统会按顺序提醒。"
    : "活动已满员，你已进入候补队列；有人退出时会优先提醒。";
}
