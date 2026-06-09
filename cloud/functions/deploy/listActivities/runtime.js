const cloud = require("wx-server-sdk");

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

const juZhangTasks = [
  { title: "开场 & 破冰", description: "借助 AI 话题卡自然开启对话" },
  { title: "活动中协调", description: "关注大家体验，必要时协助沟通" },
  { title: "AA 结算确认", description: "活动后确认每个人的支付状态" },
];

const activeRegistrationStatuses = new Set(["confirmed", "arrived"]);

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

async function findJuZhangAssignment(db, activityId, userId) {
  const result = await db.collection("juZhangAssignments").where({ activityId, candidateUserId: userId }).get();
  return result.data[0];
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

  if (existingEntry) return existingEntry;

  const queueResult = await db.collection("waitlists").where({ activityId: input.activityId, type: input.type }).get();
  const timestamp = now();
  const entry = {
    _id: `w-${input.activityId}-${input.type}-${userId}`,
    id: `w-${input.activityId}-${input.type}-${userId}`,
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
    `${activity.title} ${activity.area} ${activity.venue}`.toLowerCase().includes(keyword),
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
    _id: `r-${input.activityId}-${userId}`,
    id: `r-${input.activityId}-${userId}`,
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

async function getJuZhangWorkspace(input) {
  const db = getDb();
  const activity = await getDocument(db, "activities", input.activityId);
  const assignments = await db.collection("juZhangAssignments").where({ activityId: input.activityId }).get();
  const topicCards = await db.collection("topicCards").where({ activityId: input.activityId }).get();
  const registrations = await db.collection("registrations").where({ activityId: input.activityId }).get();
  const settlement = await getDocument(db, "settlements", input.activityId);

  return {
    activity: activity?.reviewStatus === "approved" ? activity : undefined,
    assignment: assignments.data[0],
    topicCard: topicCards.data[0],
    settlement,
    activeRegistrations: registrations.data.filter((registration) => activeRegistrationStatuses.has(registration.status)),
    tasks: juZhangTasks,
  };
}

async function respondJuZhangAssignment(input) {
  const db = getDb();
  const userId = await resolveUserId(db);
  const existingAssignment = await findJuZhangAssignment(db, input.activityId, userId);
  const timestamp = now();
  const assignment = {
    ...(existingAssignment || {
      _id: `jz-${input.activityId}-${userId}`,
      id: `jz-${input.activityId}-${userId}`,
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
    _id: `fb-${input.activityId}-${userId}`,
    id: `fb-${input.activityId}-${userId}`,
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
  signupActivity,
  joinWaitlist,
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
