import type { Registration, Settlement, User } from "./types";

export type CancellationRole = "participant" | "juZhang";

export interface ParticipantPreview {
  nickname: string;
  avatar: string;
  interests: string[];
  bio: string;
  reputationLevel: string;
  attendedEventLabel: string;
  badges: string[];
}

export interface SettlementSummary {
  label: string;
  unpaidCount: number;
  isFree: boolean;
}

export function getParticipantPreview(user: User): ParticipantPreview {
  return {
    nickname: user.nickname,
    avatar: user.avatar,
    interests: user.interests,
    bio: user.bio,
    reputationLevel: user.reputationLevel,
    attendedEventLabel: user.showAttendedEventCount ? `参加过 ${user.attendedEventCount} 场活动` : "活动经历未公开",
    badges: user.badges,
  };
}

export function canCancelWithoutPenalty(startsAt: Date, now: Date, role: CancellationRole): boolean {
  const hoursBeforeStart = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const requiredHours = role === "juZhang" ? 24 : 12;
  return hoursBeforeStart > requiredHours;
}

export function getVisibleJuZhangCandidates(users: User[], registrations: Registration[], activityId: string): User[] {
  const registrationByUser = new Map(
    registrations
      .filter((registration) => registration.activityId === activityId)
      .map((registration) => [registration.userId, registration]),
  );

  return users
    .filter((user) => user.canBeJuZhang && registrationByUser.has(user.id))
    .sort((left, right) => {
      const leftRegistration = registrationByUser.get(left.id);
      const rightRegistration = registrationByUser.get(right.id);
      const leftVolunteerScore = leftRegistration?.willingToBeJuZhang ? 1 : 0;
      const rightVolunteerScore = rightRegistration?.willingToBeJuZhang ? 1 : 0;

      if (leftVolunteerScore !== rightVolunteerScore) {
        return rightVolunteerScore - leftVolunteerScore;
      }

      return right.attendedEventCount - left.attendedEventCount;
    });
}

export function getSettlementSummary(settlement: Settlement): SettlementSummary {
  if (settlement.type === "free" || settlement.totalAmount === 0) {
    return {
      label: "本活动无费用",
      unpaidCount: 0,
      isFree: true,
    };
  }

  const perPersonAmount = Math.round(settlement.totalAmount / settlement.participantCount);
  const unpaidCount = Object.values(settlement.paymentStatusByUser).filter((hasPaid) => !hasPaid).length;

  return {
    label: `人均 ${perPersonAmount} 元`,
    unpaidCount,
    isFree: false,
  };
}

export function isMutualContact(
  firstUserId: string,
  secondUserId: string,
  selections: Record<string, string[]>,
): boolean {
  return selections[firstUserId]?.includes(secondUserId) === true && selections[secondUserId]?.includes(firstUserId) === true;
}
