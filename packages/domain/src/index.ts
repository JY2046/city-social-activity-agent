export type ActivityType = "dinner" | "coffee" | "bar" | "walk";
export type BudgetType = "paid" | "free";
export type FormationStatus = "forming" | "nearly_full" | "formed" | "ongoing" | "ended" | "cancelled";
export type RegistrationStatus = "registered" | "waitlisted" | "cancelled" | "confirmed" | "arrived" | "completed" | "noShow";
export type JuZhangStatus =
  | "candidate"
  | "invited"
  | "accepted"
  | "declined"
  | "active"
  | "completed"
  | "withdrawn"
  | "replaced";
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

const activeRegistrationStatuses = new Set<Registration["status"]>(["confirmed", "arrived"]);

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
      .filter(
        (registration) =>
          registration.activityId === activityId && activeRegistrationStatuses.has(registration.status),
      )
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
  return (
    selections[firstUserId]?.includes(secondUserId) === true &&
    selections[secondUserId]?.includes(firstUserId) === true
  );
}

export const mockUsers: User[] = [
  {
    id: "u-lin",
    nickname: "林夏",
    avatar: "LX",
    interests: ["日料", "城市散步", "独立书店"],
    bio: "刚换到静安上班，想认识下班后能轻松吃饭聊天的人。",
    reputationLevel: "可信参与者",
    attendedEventCount: 7,
    showAttendedEventCount: true,
    badges: ["准时到场"],
    canBeJuZhang: true,
  },
  {
    id: "u-chen",
    nickname: "陈予",
    avatar: "CY",
    interests: ["咖啡", "摄影", "展览"],
    bio: "周末喜欢找安静地方聊天，也喜欢城市观察。",
    reputationLevel: "优质参与者",
    attendedEventCount: 12,
    showAttendedEventCount: true,
    badges: ["友好破冰"],
    canBeJuZhang: true,
  },
  {
    id: "u-momo",
    nickname: "Momo",
    avatar: "MO",
    interests: ["小酒馆", "电影", "爵士"],
    bio: "喜欢低压力社交，不太想进大群。",
    reputationLevel: "新朋友",
    attendedEventCount: 1,
    showAttendedEventCount: false,
    badges: [],
    canBeJuZhang: true,
  },
  {
    id: "u-qiao",
    nickname: "乔一",
    avatar: "QY",
    interests: ["徒步", "咖啡", "设计"],
    bio: "希望认识生活节奏相近的新朋友。",
    reputationLevel: "靠谱局长",
    attendedEventCount: 18,
    showAttendedEventCount: true,
    badges: ["靠谱局长"],
    canBeJuZhang: true,
  },
];

export const mockActivities: Activity[] = [
  {
    id: "a-sushi",
    title: "周五下班日料小局",
    type: "dinner",
    startsAt: "2026-06-05T19:30:00+08:00",
    area: "静安寺",
    venue: "若竹日料",
    budgetType: "paid",
    estimatedCost: 168,
    capacity: 6,
    currentParticipantCount: 4,
    formationStatus: "formed",
    aiRecommendationReason: "适合想下班后轻松吃饭、但不想进入大群聊天的人。",
    aaRule: "线下 AA，局长协助确认账单和支付状态。",
    cancellationRule: "普通参与者 12 小时内退出会影响内部信誉；局长接受后 24 小时内退出会触发替换。",
    privacyRule: "活动前不开放私信和联系方式，活动后双方互选才开放联系。",
    requiresSettlement: true,
    participantIds: ["u-lin", "u-chen", "u-momo", "u-qiao"],
    gallery: [
      { imagePath: "images/activity-sushi.jpg", alt: "若竹日料寿司拼盘", sourceLabel: "场所公开图" },
      { imagePath: "images/venue-night.jpg", alt: "若竹日料夜间门店氛围", sourceLabel: "商家图" },
      { imagePath: "images/activity-coffee.jpg", alt: "以往小局桌面交流氛围", sourceLabel: "用户活动图" },
    ],
    attractionSummary:
      "若竹日料在静安寺附近，位置方便，下班后过去压力不大。店内空间偏安静，适合 4-6 人边吃边聊，不像热闹餐厅那样需要大声说话。寿司和烤物都适合分享，人均约 168 元，适合作为第一次陌生人饭局的低压力选择。",
    venueProofs: ["大众点评静安日料热门榜前列", "小红书多人收藏", "适合 4-6 人安静聊天"],
    experienceHighlights: [
      { title: "招牌寿司拼盘", description: "适合多人分享，点单压力低，开场不容易冷场。" },
      { title: "烤物和小食", description: "节奏慢，适合边吃边聊，也方便 AA 结算。" },
      { title: "安静桌位", description: "比热闹大桌更适合第一次见面的轻社交。" },
    ],
    locationGuide: "静安寺商圈步行可达，建议活动开始前 10 分钟到店门口集合。",
  },
  {
    id: "a-coffee",
    title: "周末咖啡聊天局",
    type: "coffee",
    startsAt: "2026-06-06T15:00:00+08:00",
    area: "武康路",
    venue: "梧桐边咖啡",
    budgetType: "paid",
    estimatedCost: 58,
    capacity: 5,
    currentParticipantCount: 2,
    formationStatus: "forming",
    aiRecommendationReason: "人数少、预算轻，适合第一次尝试陌生人轻社交。",
    aaRule: "各自点单，现场自行支付。",
    cancellationRule: "普通参与者 12 小时外可自由退出。",
    privacyRule: "活动前不开放私信和联系方式，活动后双方互选才开放联系。",
    requiresSettlement: true,
    participantIds: ["u-chen", "u-qiao"],
    gallery: [
      { imagePath: "images/activity-coffee.jpg", alt: "梧桐边咖啡拿铁", sourceLabel: "场所公开图" },
      { imagePath: "images/city-skyline.jpg", alt: "武康路周边城市街景", sourceLabel: "平台实拍" },
      { imagePath: "images/activity-walk.jpg", alt: "以往周末轻社交活动照片", sourceLabel: "用户活动图" },
    ],
    attractionSummary:
      "梧桐边咖啡靠近武康路，周末下午过去不赶时间，周边也适合活动后散步。这里预算轻、人数少，聊天声音不用太大，适合第一次尝试陌生人轻社交的人。人均约 58 元，点一杯咖啡就能自然坐下来聊。",
    venueProofs: ["武康路周边热门咖啡馆", "适合第一次轻社交", "预算轻、停留感强"],
    experienceHighlights: [
      { title: "手冲咖啡", description: "适合从口味偏好自然展开话题。" },
      { title: "窗边座位", description: "氛围松弛，适合两三人轮流聊天。" },
      { title: "活动后散步", description: "周边街区适合继续轻松走一段。" },
    ],
    locationGuide: "武康路梧桐街区内，建议地铁到站后步行前往，活动后可顺路散步。",
  },
  {
    id: "a-bar",
    title: "小酒馆微醺聊天局",
    type: "bar",
    startsAt: "2026-06-06T20:30:00+08:00",
    area: "陕西南路",
    venue: "三楼小酒馆",
    budgetType: "paid",
    estimatedCost: 120,
    capacity: 2,
    currentParticipantCount: 2,
    formationStatus: "formed",
    aiRecommendationReason: "适合愿意轻松聊天的人，系统会强调边界和安全规则。",
    aaRule: "线下 AA，不强制拼酒。",
    cancellationRule: "临近活动退出会影响内部信誉。",
    privacyRule: "活动前不开放私信和联系方式，活动后双方互选才开放联系。",
    requiresSettlement: true,
    participantIds: ["u-lin", "u-momo"],
    gallery: [
      { imagePath: "images/activity-bar.jpg", alt: "小酒馆夜间吧台", sourceLabel: "场所公开图" },
      { imagePath: "images/venue-night.jpg", alt: "小酒馆门口夜间氛围", sourceLabel: "商家图" },
      { imagePath: "images/activity-sushi.jpg", alt: "以往饭局桌面分享照片", sourceLabel: "用户活动图" },
    ],
    attractionSummary:
      "三楼小酒馆在陕西南路附近，适合想轻松聊天但不想进入大型酒局的人。空间偏暗、节奏慢，适合小范围微醺聊天，系统会强调边界和安全规则。人均约 120 元，适合愿意尝试夜间轻社交、但希望人数可控的人。",
    venueProofs: ["陕西南路小酒馆热门收藏", "小桌低压力聊天", "平台强调边界和安全"],
    experienceHighlights: [
      { title: "低度特调", description: "适合微醺但不强制拼酒。" },
      { title: "吧台小食", description: "方便边聊边点，消费更容易控制。" },
      { title: "暗调氛围", description: "更适合放松聊天，不适合大声热闹局。" },
    ],
    locationGuide: "陕西南路附近，建议结伴离场或使用打车，活动中不强制饮酒。",
  },
  {
    id: "a-walk",
    title: "免费城市散步局",
    type: "walk",
    startsAt: "2026-06-07T10:00:00+08:00",
    area: "苏州河",
    venue: "四行仓库集合",
    budgetType: "free",
    estimatedCost: 0,
    capacity: 8,
    currentParticipantCount: 3,
    formationStatus: "formed",
    aiRecommendationReason: "费用为 0，适合想低门槛体验平台活动的新用户。",
    aaRule: "本活动无费用。",
    cancellationRule: "普通参与者 12 小时外可自由退出。",
    privacyRule: "活动前不开放私信和联系方式，活动后双方互选才开放联系。",
    requiresSettlement: false,
    participantIds: ["u-lin", "u-chen", "u-qiao"],
    gallery: [
      { imagePath: "images/activity-walk.jpg", alt: "苏州河散步路线", sourceLabel: "平台实拍" },
      { imagePath: "images/city-skyline.jpg", alt: "上海城市河岸风景", sourceLabel: "场所公开图" },
      { imagePath: "images/activity-coffee.jpg", alt: "以往散步后咖啡休息照片", sourceLabel: "用户活动图" },
    ],
    attractionSummary:
      "苏州河这段路线开阔、节奏轻，适合第一次尝试平台活动的人。费用为 0，不需要处理 AA，也没有餐桌社交的压力。边走边聊更自然，如果聊得来，活动后还可以一起找咖啡店继续坐一会儿。",
    venueProofs: ["免费低门槛", "路线开阔好找", "适合第一次参加"],
    experienceHighlights: [
      { title: "河岸路线", description: "边走边聊，沉默也不会尴尬。" },
      { title: "四行仓库集合", description: "地点明确，第一次参加也容易找到。" },
      { title: "活动后可续聊", description: "双方愿意时可附近找咖啡继续聊。" },
    ],
    locationGuide: "四行仓库附近集合，沿苏州河轻松步行，本活动无费用。",
  },
];

export const mockRegistrations: Registration[] = [
  { id: "r-1", userId: "u-lin", activityId: "a-sushi", status: "confirmed", willingToBeJuZhang: true },
  { id: "r-2", userId: "u-chen", activityId: "a-sushi", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-3", userId: "u-qiao", activityId: "a-sushi", status: "arrived", willingToBeJuZhang: true },
  { id: "r-sushi-momo", userId: "u-momo", activityId: "a-sushi", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-coffee-chen", userId: "u-chen", activityId: "a-coffee", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-coffee-qiao", userId: "u-qiao", activityId: "a-coffee", status: "confirmed", willingToBeJuZhang: true },
  { id: "r-bar-lin", userId: "u-lin", activityId: "a-bar", status: "confirmed", willingToBeJuZhang: true },
  { id: "r-bar-momo", userId: "u-momo", activityId: "a-bar", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-walk-lin", userId: "u-lin", activityId: "a-walk", status: "confirmed", willingToBeJuZhang: true },
  { id: "r-walk-chen", userId: "u-chen", activityId: "a-walk", status: "confirmed", willingToBeJuZhang: false },
  { id: "r-walk-qiao", userId: "u-qiao", activityId: "a-walk", status: "confirmed", willingToBeJuZhang: true },
];

export const mockJuZhangAssignments: JuZhangAssignment[] = [
  { id: "jz-1", activityId: "a-sushi", candidateUserId: "u-qiao", status: "accepted", volunteered: true },
];

export const mockTopicCards: TopicCard[] = [
  {
    id: "topic-sushi",
    activityId: "a-sushi",
    visibleText: "如果只能把上海一个下班后最放松的地方推荐给新朋友，你会选哪里？",
  },
  {
    id: "topic-coffee",
    activityId: "a-coffee",
    visibleText: "最近有没有一个让你愿意专门出门的咖啡馆、展览或小店？",
  },
  {
    id: "topic-bar",
    activityId: "a-bar",
    visibleText: "你更喜欢热闹小酒馆，还是能安静聊天的小吧台？",
  },
  {
    id: "topic-walk",
    activityId: "a-walk",
    visibleText: "你在这座城市里最喜欢的一段路是哪一段？",
  },
];

export const mockSettlements: Settlement[] = [
  {
    activityId: "a-sushi",
    type: "paid",
    totalAmount: 672,
    participantCount: 4,
    paymentStatusByUser: {
      "u-lin": true,
      "u-chen": true,
      "u-momo": false,
      "u-qiao": true,
    },
  },
  {
    activityId: "a-coffee",
    type: "paid",
    totalAmount: 116,
    participantCount: 2,
    paymentStatusByUser: {
      "u-chen": true,
      "u-qiao": false,
    },
  },
  {
    activityId: "a-bar",
    type: "paid",
    totalAmount: 240,
    participantCount: 2,
    paymentStatusByUser: {
      "u-lin": true,
      "u-momo": false,
    },
  },
  {
    activityId: "a-walk",
    type: "free",
    totalAmount: 0,
    participantCount: 3,
    paymentStatusByUser: {},
  },
];
