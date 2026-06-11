import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  mockActivities,
  mockJuZhangAssignments,
  mockRegistrations,
  mockSettlements,
  mockTopicCards,
  mockUsers,
} from "../packages/domain/dist/index.js";

const outputDir = resolve("cloud/seed");
const seedNow = "2026-06-09T12:00:00.000Z";

const currentUser = {
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

function toMiniProgramImagePath(imagePath) {
  return imagePath.startsWith("/assets/") ? imagePath : `/assets/${imagePath}`;
}

function toCloudUserDocument(user) {
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

function toCloudActivityDocument(activity) {
  const gallery = activity.gallery.map((item) => ({
    ...item,
    imagePath: toMiniProgramImagePath(item.imagePath),
  }));

  return {
    ...activity,
    _id: activity.id,
    city: activity.city,
    coverImagePath: gallery[0]?.imagePath ?? "/assets/images/activity-sushi.jpg",
    gallery,
    photos: gallery,
    reviewStatus: "approved",
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudRegistrationDocument(registration) {
  return {
    ...registration,
    _id: registration.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudSettlementDocument(settlement) {
  return {
    ...settlement,
    _id: settlement.activityId,
    merchantPaymentMode: settlement.type === "free" ? "free" : "selfPayToMerchant",
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudJuZhangAssignmentDocument(assignment) {
  return {
    ...assignment,
    _id: assignment.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

function toCloudTopicCardDocument(topicCard) {
  return {
    ...topicCard,
    _id: topicCard.id,
    createdAt: seedNow,
    updatedAt: seedNow,
  };
}

const seedData = {
  users: [...structuredClone(mockUsers), currentUser].map(toCloudUserDocument),
  activities: structuredClone(mockActivities).map(toCloudActivityDocument),
  registrations: structuredClone(mockRegistrations).map(toCloudRegistrationDocument),
  settlements: structuredClone(mockSettlements).map(toCloudSettlementDocument),
  waitlists: [],
  juZhangAssignments: structuredClone(mockJuZhangAssignments).map(toCloudJuZhangAssignmentDocument),
  topicCards: structuredClone(mockTopicCards).map(toCloudTopicCardDocument),
  feedback: [],
  adminActions: [],
};

await mkdir(outputDir, { recursive: true });

await Promise.all(
  Object.entries(seedData).flatMap(([name, documents]) => [
    writeFile(resolve(outputDir, `${name}.json`), `${JSON.stringify(documents, null, 2)}\n`),
    writeFile(resolve(outputDir, `${name}.jsonl`), `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`),
  ]),
);

console.log(`Wrote ${Object.keys(seedData).length * 2} seed files to ${outputDir}`);
