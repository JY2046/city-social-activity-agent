export type ActivityType = "dinner" | "coffee" | "bar" | "walk";
export type BudgetType = "paid" | "free";
export type FormationStatus = "forming" | "nearly_full" | "formed" | "ongoing" | "ended" | "cancelled";
export type RegistrationStatus = "registered" | "waitlisted" | "cancelled" | "confirmed" | "arrived" | "completed" | "noShow";
export type JuZhangStatus = "candidate" | "invited" | "accepted" | "declined" | "active" | "completed" | "withdrawn" | "replaced";
export type ReputationLevel = "新朋友" | "可信参与者" | "优质参与者" | "局长" | "靠谱局长";

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  interests: string[];
  bio: string;
  reputationLevel: ReputationLevel;
  attendedEventCount: number;
  showAttendedEventCount: boolean;
  badges: string[];
  canBeJuZhang: boolean;
}

export interface ActivityGalleryItem {
  imagePath: string;
  alt: string;
  sourceLabel: string;
}

export interface ActivityExperienceHighlight {
  title: string;
  description: string;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  startsAt: string;
  area: string;
  venue: string;
  budgetType: BudgetType;
  estimatedCost: number;
  capacity: number;
  currentParticipantCount: number;
  formationStatus: FormationStatus;
  aiRecommendationReason: string;
  aaRule: string;
  cancellationRule: string;
  privacyRule: string;
  requiresSettlement: boolean;
  participantIds: string[];
  gallery: ActivityGalleryItem[];
  attractionSummary: string;
  venueProofs: string[];
  experienceHighlights: ActivityExperienceHighlight[];
  locationGuide: string;
}

export interface Registration {
  id: string;
  userId: string;
  activityId: string;
  status: RegistrationStatus;
  willingToBeJuZhang: boolean;
}

export interface TopicCard {
  id: string;
  activityId: string;
  visibleText: string;
}

export interface JuZhangAssignment {
  id: string;
  activityId: string;
  candidateUserId: string;
  status: JuZhangStatus;
  volunteered: boolean;
}

export interface Settlement {
  activityId: string;
  type: BudgetType;
  totalAmount: number;
  participantCount: number;
  paymentStatusByUser: Record<string, boolean>;
}
