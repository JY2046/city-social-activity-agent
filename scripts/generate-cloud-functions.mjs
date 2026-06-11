import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputRoots = [resolve("cloud/functions/deploy"), resolve("apps/miniprogram/cloudfunctions")];
const functionNames = [
  "listActivities",
  "getActivityDetail",
  "listMyRegistrations",
  "signupActivity",
  "cancelRegistration",
  "joinWaitlist",
  "cancelWaitlist",
  "confirmArrival",
  "confirmSettlement",
  "getJuZhangWorkspace",
  "respondJuZhangAssignment",
  "submitFeedback",
  "getFeedbackCompletionState",
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
  if (message === "Forbidden") return fail("FORBIDDEN", message);
  if (message.startsWith("Invalid ")) return fail("INVALID_INPUT", message);

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

const juZhangTasks = [
  { title: "开场 & 破冰", description: "借助 AI 话题卡自然开启对话" },
  { title: "活动中协调", description: "关注大家体验，必要时协助沟通" },
  { title: "AA 结算确认", description: "活动后确认每个人的支付状态" },
];

const activeRegistrationStatuses = new Set(["confirmed", "arrived"]);
const arrivalStatusValues = new Set(["confirmed", "arrived", "noShow"]);
const juZhangResponseValues = new Set(["accepted", "declined"]);

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
  const { _id, ...data } = document;

  await db.collection(collectionName).doc(_id).set({ data });
  return document;
}

async function findRegistration(db, activityId, userId) {
  const result = await db.collection("registrations").where({ activityId, userId }).get();
  return result.data[0];
}

async function hasActiveRegistration(db, activityId, userId) {
  const registration = await findRegistration(db, activityId, userId);

  return registration ? registration.status !== "cancelled" : false;
}

async function findJuZhangAssignment(db, activityId, userId) {
  const result = await db.collection("juZhangAssignments").where({ activityId, candidateUserId: userId }).get();
  return result.data[0];
}

async function isAcceptedJuZhang(db, activityId, userId) {
  const assignment = await findJuZhangAssignment(db, activityId, userId);

  return assignment?.status === "accepted";
}

function isValidArrivalStatus(status) {
  return typeof status === "string" && arrivalStatusValues.has(status);
}

function isValidJuZhangResponse(response) {
  return typeof response === "string" && juZhangResponseValues.has(response);
}

function isMutualContact(firstUserId, secondUserId, selections) {
  return (
    selections[firstUserId]?.includes(secondUserId) === true &&
    selections[secondUserId]?.includes(firstUserId) === true
  );
}

async function createOrGetWaitlistEntry(db, input, userId) {
  const existingResult = await db.collection("waitlists").where({
    activityId: input.activityId,
    userId,
    type: input.type,
  }).get();
  const existingEntry = existingResult.data[0];

  if (existingEntry) {
    if (existingEntry.status === "waiting") {
      return existingEntry;
    }

    return setDocument(db, "waitlists", {
      ...existingEntry,
      status: "waiting",
      updatedAt: now(),
    });
  }

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

async function cancelExistingWaitlistEntry(db, input, userId) {
  const result = await db.collection("waitlists").where({
    activityId: input.activityId,
    userId,
    type: input.type,
    status: "waiting",
  }).get();
  const existingEntry = result.data[0];

  if (!existingEntry) {
    throw new Error("Active waitlist entry not found");
  }

  return setDocument(db, "waitlists", {
    ...existingEntry,
    status: "cancelled",
    updatedAt: now(),
  });
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

async function listMyRegistrations() {
  const db = getDb();
  const userId = await resolveUserId(db);
  const result = await db.collection("registrations").where({ userId }).get();

  return result.data.filter((registration) => registration.status !== "cancelled");
}

async function signupActivity(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const activity = await getDocument(db, "activities", input.activityId);

  if (!activity || activity.reviewStatus !== "approved") {
    throw new Error("Activity not found");
  }

  const existingRegistration = await findRegistration(db, input.activityId, userId);
  if (existingRegistration && existingRegistration.status !== "cancelled") return existingRegistration;

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

async function cancelRegistration(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const activity = await getDocument(db, "activities", input.activityId);

  if (!activity || activity.reviewStatus !== "approved") {
    throw new Error("Activity not found");
  }

  const registration = await findRegistration(db, input.activityId, userId);

  if (!registration || registration.status === "cancelled") {
    throw new Error("Active registration not found");
  }

  const timestamp = now();
  const wasActive = registration.status !== "waitlisted";
  const cancelledRegistration = await setDocument(db, "registrations", {
    ...registration,
    status: "cancelled",
    updatedAt: timestamp,
  });

  if (wasActive) {
    await setDocument(db, "activities", {
      ...activity,
      currentParticipantCount: Math.max(activity.currentParticipantCount - 1, 0),
      participantIds: activity.participantIds.filter((participantId) => participantId !== userId),
      formationStatus: activity.currentParticipantCount - 1 >= activity.capacity ? activity.formationStatus : "forming",
      updatedAt: timestamp,
    });
  }

  const settlement = await getDocument(db, "settlements", input.activityId);

  if (settlement && settlement.type === "paid" && settlement.paymentStatusByUser[userId] !== undefined) {
    const nextPaymentStatusByUser = { ...settlement.paymentStatusByUser };
    delete nextPaymentStatusByUser[userId];

    await setDocument(db, "settlements", {
      ...settlement,
      participantCount: Math.max(settlement.participantCount - 1, 0),
      paymentStatusByUser: nextPaymentStatusByUser,
      updatedAt: timestamp,
    });
  }

  return cancelledRegistration;
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

async function cancelWaitlist(input) {
  const db = getDb();
  const userId = await resolveUserId(db);

  return cancelExistingWaitlistEntry(db, input, userId);
}

async function confirmArrival(input) {
  const db = getDb();
  const currentUserId = await resolveUserId(db);
  if (!isValidArrivalStatus(input.status)) {
    throw new Error("Invalid arrival status");
  }

  const targetUserId = input.userId || currentUserId;
  if (targetUserId !== currentUserId && !(await isAcceptedJuZhang(db, input.activityId, currentUserId))) {
    throw new Error("Forbidden");
  }

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

  const acceptedJuZhang = await isAcceptedJuZhang(db, input.activityId, userId);
  const participantPaymentUserIds = Object.keys(input.participantPaymentStates || {});

  if ((input.totalAmount !== undefined || input.mode === "juZhangCollects") && !acceptedJuZhang) {
    throw new Error("Forbidden");
  }

  if (participantPaymentUserIds.some((targetUserId) => targetUserId !== userId) && !acceptedJuZhang) {
    throw new Error("Forbidden");
  }

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

async function getJuZhangWorkspace(input) {
  const db = getDb();
  const userId = await resolveUserId(db);

  const currentRegistration = await findRegistration(db, input.activityId, userId);
  const currentUserAssignment = await findJuZhangAssignment(db, input.activityId, userId);
  const currentUserWaitlists = await db.collection("waitlists").where({ activityId: input.activityId, userId, type: "juZhang" }).get();
  const juZhangWaitlistEntry = currentUserWaitlists.data.find((entry) => entry.status === "waiting");
  const canManageWorkspace =
    currentRegistration?.willingToBeJuZhang === true ||
    currentUserAssignment !== undefined ||
    juZhangWaitlistEntry !== undefined;

  if (!(await hasActiveRegistration(db, input.activityId, userId))) {
    return {
      currentUserId: userId,
      currentRegistration: undefined,
      activity: undefined,
      assignment: undefined,
      topicCard: undefined,
      settlement: undefined,
      juZhangWaitlistEntry: undefined,
      activeRegistrations: [],
      tasks: [],
    };
  }

  const activity = await getDocument(db, "activities", input.activityId);
  const assignments = await db.collection("juZhangAssignments").where({ activityId: input.activityId }).get();
  const topicCards = await db.collection("topicCards").where({ activityId: input.activityId }).get();
  const registrations = await db.collection("registrations").where({ activityId: input.activityId }).get();
  const settlement = await getDocument(db, "settlements", input.activityId);

  return {
    activity: activity?.reviewStatus === "approved" ? activity : undefined,
    currentUserId: userId,
    currentRegistration,
    assignment: assignments.data[0],
    topicCard: topicCards.data[0],
    settlement: canManageWorkspace ? settlement : undefined,
    juZhangWaitlistEntry,
    activeRegistrations: canManageWorkspace
      ? registrations.data.filter((registration) => activeRegistrationStatuses.has(registration.status))
      : [],
    tasks: canManageWorkspace ? juZhangTasks : [],
  };
}

async function respondJuZhangAssignment(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  if (!isValidJuZhangResponse(input.response)) {
    throw new Error("Invalid ju zhang response");
  }

  const existingAssignment = await findJuZhangAssignment(db, input.activityId, userId);
  const timestamp = now();
  const assignment = {
    ...(existingAssignment || {
      _id: \`jz-\${input.activityId}-\${userId}\`,
      id: \`jz-\${input.activityId}-\${userId}\`,
      activityId: input.activityId,
      candidateUserId: userId,
      volunteered: true,
      createdAt: timestamp,
    }),
    status: input.response,
    updatedAt: timestamp,
  };

  return setDocument(db, "juZhangAssignments", assignment);
}

async function submitFeedback(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const timestamp = now();
  const feedback = {
    _id: \`fb-\${input.activityId}-\${userId}\`,
    id: \`fb-\${input.activityId}-\${userId}\`,
    activityId: input.activityId,
    userId,
    selectedUserIds: input.selectedUserIds,
    abnormalText: input.abnormalText,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return setDocument(db, "feedback", feedback);
}

async function getFeedbackCompletionState(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const feedbackResult = await db.collection("feedback").where({ activityId: input.activityId }).get();
  const selections = Object.fromEntries(
    feedbackResult.data.map((entry) => [entry.userId, entry.selectedUserIds]),
  );
  const hasSubmitted = feedbackResult.data.some((entry) => entry.userId === userId);
  const isMutual = isMutualContact(userId, input.candidateUserId, selections);

  return {
    hasSubmitted,
    isMutual,
    contactStateLabel: isMutual ? "已互选，可开放联系" : hasSubmitted ? "已提交反馈" : "等待反馈",
  };
}

const handlers = {
  listActivities,
  getActivityDetail,
  listMyRegistrations,
  signupActivity,
  cancelRegistration,
  joinWaitlist,
  cancelWaitlist,
  confirmArrival,
  confirmSettlement,
  getJuZhangWorkspace,
  respondJuZhangAssignment,
  submitFeedback,
  getFeedbackCompletionState,
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

function createConfigJson() {
  return `${JSON.stringify(
    {
      timeout: 20,
    },
    null,
    2,
  )}\n`;
}

await Promise.all(
  outputRoots.flatMap((outputRoot) =>
    functionNames.map(async (functionName) => {
      const functionDir = resolve(outputRoot, functionName);
      await mkdir(functionDir, { recursive: true });
      await Promise.all([
        writeFile(resolve(functionDir, "index.js"), createIndexSource(functionName)),
        writeFile(resolve(functionDir, "runtime.js"), runtimeSource),
        writeFile(resolve(functionDir, "package.json"), createPackageJson(functionName)),
        writeFile(resolve(functionDir, "config.json"), createConfigJson()),
      ]);
    }),
  ),
);

console.log(
  `Wrote ${functionNames.length} deployable cloud functions to ${outputRoots.map((outputRoot) => outputRoot).join(", ")}`,
);
