import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputRoot = resolve("cloud/functions/deploy");
const functionNames = [
  "listActivities",
  "getActivityDetail",
  "signupActivity",
  "joinWaitlist",
  "confirmArrival",
  "confirmSettlement",
];

const runtimeSource = `const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function ok(data) {
  return { ok: true, code: "OK", message: "ok", data };
}

function fail(code, message) {
  return { ok: false, code, message, data: null };
}

function toFailureEnvelope(error) {
  const message = error instanceof Error ? error.message : "Cloud database operation failed";

  if (message === "Activity not found") return fail("ACTIVITY_NOT_FOUND", message);
  if (message === "Active registration not found") return fail("REGISTRATION_NOT_FOUND", message);
  if (message === "Settlement not found") return fail("SETTLEMENT_NOT_FOUND", message);

  return fail("DATABASE_OPERATION_FAILED", message);
}

async function run(operation) {
  try {
    return ok(await operation());
  } catch (error) {
    return toFailureEnvelope(error);
  }
}

function compactQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));
}

function now() {
  return new Date().toISOString();
}

function getDb() {
  return cloud.database();
}

async function resolveUserId(db) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    throw new Error("WeChat openid is unavailable");
  }

  const existingUser = await db.collection("users").where({ openid }).get();

  if (existingUser.data[0]) {
    return existingUser.data[0]._id || existingUser.data[0].id;
  }

  return openid;
}

async function getDocument(db, collectionName, id) {
  const result = await db.collection(collectionName).doc(id).get();
  return result.data;
}

async function setDocument(db, collectionName, document) {
  await db.collection(collectionName).doc(document._id).set({ data: document });
  return document;
}

async function findRegistration(db, activityId, userId) {
  const result = await db.collection("registrations").where({ activityId, userId }).get();
  return result.data[0];
}

async function createOrGetWaitlistEntry(db, input, userId) {
  const existingResult = await db.collection("waitlists").where({
    activityId: input.activityId,
    userId,
    type: input.type,
  }).get();
  const existingEntry = existingResult.data[0];

  if (existingEntry) return existingEntry;

  const queueResult = await db.collection("waitlists").where({ activityId: input.activityId, type: input.type }).get();
  const timestamp = now();
  const entry = {
    _id: \`w-\${input.activityId}-\${input.type}-\${userId}\`,
    id: \`w-\${input.activityId}-\${input.type}-\${userId}\`,
    activityId: input.activityId,
    userId,
    type: input.type,
    order: queueResult.data.length + 1,
    status: "waiting",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return setDocument(db, "waitlists", entry);
}

async function listActivities(input = {}) {
  const db = getDb();
  const result = await db.collection("activities").where(
    compactQuery({
      city: input.city,
      type: input.type,
      budgetType: input.budgetType,
      reviewStatus: "approved",
    }),
  ).get();
  const keyword = input.keyword && input.keyword.trim().toLowerCase();

  if (!keyword) return result.data;

  return result.data.filter((activity) =>
    \`\${activity.title} \${activity.area} \${activity.venue}\`.toLowerCase().includes(keyword),
  );
}

async function getActivityDetail(input) {
  const db = getDb();
  const activity = await getDocument(db, "activities", input.activityId);

  if (!activity || activity.reviewStatus !== "approved") {
    throw new Error("Activity not found");
  }

  return { activity };
}

async function signupActivity(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const activity = await getDocument(db, "activities", input.activityId);

  if (!activity || activity.reviewStatus !== "approved") {
    throw new Error("Activity not found");
  }

  const existingRegistration = await findRegistration(db, input.activityId, userId);
  if (existingRegistration) return existingRegistration;

  const timestamp = now();
  const registration = {
    _id: \`r-\${input.activityId}-\${userId}\`,
    id: \`r-\${input.activityId}-\${userId}\`,
    activityId: input.activityId,
    userId,
    status: activity.currentParticipantCount >= activity.capacity ? "waitlisted" : "confirmed",
    willingToBeJuZhang: Boolean(input.willingToBeJuZhang),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (registration.status === "waitlisted") {
    await createOrGetWaitlistEntry(db, { activityId: input.activityId, type: "activity" }, userId);
    return setDocument(db, "registrations", registration);
  }

  await setDocument(db, "registrations", registration);
  await setDocument(db, "activities", {
    ...activity,
    currentParticipantCount: activity.currentParticipantCount + 1,
    participantIds: [...activity.participantIds, userId],
    formationStatus: activity.currentParticipantCount + 1 >= activity.capacity ? "formed" : activity.formationStatus,
    updatedAt: timestamp,
  });

  const settlement = await getDocument(db, "settlements", input.activityId);
  if (settlement && settlement.type === "paid") {
    await setDocument(db, "settlements", {
      ...settlement,
      participantCount: settlement.participantCount + 1,
      paymentStatusByUser: { ...settlement.paymentStatusByUser, [userId]: false },
      updatedAt: timestamp,
    });
  }

  return registration;
}

async function joinWaitlist(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const activity = await getDocument(db, "activities", input.activityId);

  if (!activity || activity.reviewStatus !== "approved") {
    throw new Error("Activity not found");
  }

  return createOrGetWaitlistEntry(db, input, userId);
}

async function confirmArrival(input) {
  const db = getDb();
  const currentUserId = await resolveUserId(db);
  const targetUserId = input.userId || currentUserId;
  const registration = await findRegistration(db, input.activityId, targetUserId);

  if (!registration || registration.status === "waitlisted" || registration.status === "cancelled") {
    throw new Error("Active registration not found");
  }

  return setDocument(db, "registrations", { ...registration, status: input.status, updatedAt: now() });
}

async function confirmSettlement(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const settlement = await getDocument(db, "settlements", input.activityId);

  if (!settlement) throw new Error("Settlement not found");
  if (settlement.type === "free" || settlement.totalAmount === 0 || input.mode === "free") return settlement;

  return setDocument(db, "settlements", {
    ...settlement,
    totalAmount: input.totalAmount || settlement.totalAmount,
    merchantPaymentMode: input.mode,
    paymentStatusByUser: input.participantPaymentStates
      ? { ...settlement.paymentStatusByUser, ...input.participantPaymentStates }
      : { ...settlement.paymentStatusByUser, [userId]: true },
    updatedAt: now(),
  });
}

const handlers = {
  listActivities,
  getActivityDetail,
  signupActivity,
  joinWaitlist,
  confirmArrival,
  confirmSettlement,
};

function createMain(functionName) {
  return async function main(event) {
    const handler = handlers[functionName];

    if (!handler) return fail("FUNCTION_NOT_FOUND", "Cloud function not found");

    return run(() => handler(event || {}));
  };
}

module.exports = { createMain };
`;

function createIndexSource(functionName) {
  return `const { createMain } = require("./runtime");

exports.main = createMain("${functionName}");
`;
}

function toPackageName(functionName) {
  return `kaigexiaoju-${functionName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function createPackageJson(functionName) {
  return `${JSON.stringify(
    {
      name: toPackageName(functionName),
      version: "0.1.0",
      private: true,
      main: "index.js",
      dependencies: {
        "wx-server-sdk": "latest",
      },
    },
    null,
    2,
  )}\n`;
}

await Promise.all(
  functionNames.map(async (functionName) => {
    const functionDir = resolve(outputRoot, functionName);
    await mkdir(functionDir, { recursive: true });
    await Promise.all([
      writeFile(resolve(functionDir, "index.js"), createIndexSource(functionName)),
      writeFile(resolve(functionDir, "runtime.js"), runtimeSource),
      writeFile(resolve(functionDir, "package.json"), createPackageJson(functionName)),
    ]);
  }),
);

console.log(`Wrote ${functionNames.length} deployable cloud functions to ${outputRoot}`);
