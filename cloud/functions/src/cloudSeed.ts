import {
  mockActivities,
  mockJuZhangAssignments,
  mockRegistrations,
  mockSettlements,
  mockTopicCards,
  mockUsers,
  type Activity,
  type ActivityGalleryItem,
  type JuZhangAssignment,
  type Registration,
  type Settlement,
  type TopicCard,
  type User,
} from "@city-social/domain";

export interface CloudUserDocument extends User {
  _id: string;
  openid: string;
  city: string;
  status: "active" | "limited" | "blocked";
  createdAt: string;
  updatedAt: string;
}

export interface CloudActivityDocument extends Activity {
  _id: string;
  city: string;
  coverImagePath: string;
  gallery: ActivityGalleryItem[];
  photos: ActivityGalleryItem[];
  reviewStatus: "approved" | "draft" | "pending" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface CloudRegistrationDocument extends Registration {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSettlementDocument extends Settlement {
  _id: string;
  merchantPaymentMode: "selfPayToMerchant" | "juZhangCollects" | "free";
  createdAt: string;
  updatedAt: string;
}

export interface CloudJuZhangAssignmentDocument extends JuZhangAssignment {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudTopicCardDocument extends TopicCard {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudFeedbackDocument {
  _id: string;
  id: string;
  activityId: string;
  userId: string;
  selectedUserIds: string[];
  abnormalText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSeedData {
  users: CloudUserDocument[];
  activities: CloudActivityDocument[];
  registrations: CloudRegistrationDocument[];
  settlements: CloudSettlementDocument[];
  waitlists: [];
  juZhangAssignments: CloudJuZhangAssignmentDocument[];
  topicCards: CloudTopicCardDocument[];
  feedback: CloudFeedbackDocument[];
  adminActions: [];
}

const seedNow = "2026-06-09T12:00:00.000Z";

const currentUser: User = {
  id: "u-current",
  nickname: "Lily",
  avatar: "L",
  interests: ["饭局", "咖啡", "城市散步"],
  bio: "正在体验小程序冷启动版本。",
  reputationLevel: "可信参与者",
  attendedEventCount: 5,
  showAttendedEventCount: true,
  badges: ["准时到场"],
  canBeJuZhang: true,
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toMiniProgramImagePath(imagePath: string): string {
  return imagePath.startsWith("/assets/") ? imagePath : `/assets/${imagePath}`;
}

function toCloudUserDocument(user: User): CloudUserDocument {
  return {
    ...user,
    _id: user.id,
    openid: `seed-openid-${user.id}`,
    city: "上海",
    status: "active",
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudActivityDocument(activity: Activity): CloudActivityDocument {
  const gallery = activity.gallery.map((item) => ({
    ...item,
    imagePath: toMiniProgramImagePath(item.imagePath),
  }));

  return {
    ...activity,
    _id: activity.id,
    city: "上海",
    coverImagePath: gallery[0]?.imagePath ?? "/assets/images/activity-sushi.jpg",
    gallery,
    photos: gallery,
    reviewStatus: "approved",
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudRegistrationDocument(registration: Registration): CloudRegistrationDocument {
  return {
    ...registration,
    _id: registration.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudSettlementDocument(settlement: Settlement): CloudSettlementDocument {
  return {
    ...settlement,
    _id: settlement.activityId,
    merchantPaymentMode: settlement.type === "free" ? "free" : "selfPayToMerchant",
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudJuZhangAssignmentDocument(assignment: JuZhangAssignment): CloudJuZhangAssignmentDocument {
  return {
    ...assignment,
    _id: assignment.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudTopicCardDocument(topicCard: TopicCard): CloudTopicCardDocument {
  return {
    ...topicCard,
    _id: topicCard.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

export function createCloudSeedData(): CloudSeedData {
  return {
    users: [...clone(mockUsers), currentUser].map(toCloudUserDocument),
    activities: clone(mockActivities).map(toCloudActivityDocument),
    registrations: clone(mockRegistrations).map(toCloudRegistrationDocument),
    settlements: clone(mockSettlements).map(toCloudSettlementDocument),
    waitlists: [],
    juZhangAssignments: clone(mockJuZhangAssignments).map(toCloudJuZhangAssignmentDocument),
    topicCards: clone(mockTopicCards).map(toCloudTopicCardDocument),
    feedback: [],
    adminActions: [],
  };
}
