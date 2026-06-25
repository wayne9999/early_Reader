import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp, type DocumentData, type QueryDocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import Stripe from "stripe";
import { parseBudgetLimit, recordAiBudgetActual, reserveAiBudget, type AiBudgetDecision } from "./aiBudget.js";
import { buildOpenAiInsight, buildRuleBasedInsight, loadRecentLearningEvents, summarizeLearningEvents, writeStudentInsight } from "./aiLearning.js";
import { sendSupportSummaryEmail, summarizeSupportCase } from "./supportWorkflow.js";

initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const openAiApiKey = defineSecret("OPENAI_API_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");
const appBaseUrl = process.env.READNEST_APP_BASE_URL ?? "https://myreadnest.org/";
const aiModel = process.env.READNEST_AI_MODEL ?? "gpt-5.5";
const supportNotificationEmail = process.env.SUPPORT_NOTIFICATION_EMAIL ?? "support@myreadnest.org";
const supportFromEmail = process.env.SUPPORT_FROM_EMAIL ?? "ReadNest Support <support@myreadnest.org>";
const enforceAppCheck = process.env.READNEST_ENFORCE_APP_CHECK === "true";
const aiWarningLimitUsd = parseBudgetLimit(process.env.READNEST_AI_WARNING_LIMIT_USD, 10);
const aiMonthlyLimitUsd = parseBudgetLimit(process.env.READNEST_AI_MONTHLY_LIMIT_USD, 15);
const aiEstimatedCostPerInsightUsd = parseBudgetLimit(process.env.READNEST_AI_ESTIMATED_COST_PER_INSIGHT_USD, 0.05);
const aiEstimatedInputTokenCostPerMillionUsd = parseBudgetLimit(process.env.READNEST_AI_INPUT_COST_PER_1M_USD, 0);
const aiEstimatedOutputTokenCostPerMillionUsd = parseBudgetLimit(process.env.READNEST_AI_OUTPUT_COST_PER_1M_USD, 0);

type SubscriptionTier = "free" | "familyPlus" | "teacherPro";
type SubscriptionStatus = "free" | "checkoutStarted" | "active" | "pastDue" | "canceled";
type AiJobRequestKind = "teacherRequested" | "scheduled" | "legacyRecommendation" | "thresholdTriggered";

const defaultTeacherCapacity = 12;
const learningCoachThresholdEvents = 8;
const learningCoachCooldownMs = 12 * 60 * 60 * 1000;

type LogSeverity = "info" | "warning" | "error";
type RateLimitAction =
  | "billingPortal"
  | "checkout"
  | "claimStudent"
  | "manageAssignment"
  | "learningRecommendation"
  | "studentInsight"
  | "supportCase";

async function enforceUserRateLimit(options: {
  userId: string;
  action: RateLimitAction;
  maxAttempts: number;
  windowMs: number;
}) {
  const db = getFirestore();
  const limitRef = db.doc(`abuseRateLimits/${options.userId}_${options.action}`);
  const nowMs = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limitRef);
    const data = snapshot.data() ?? {};
    const windowStartedAtMs = typeof data.windowStartedAtMs === "number" ? data.windowStartedAtMs : 0;
    const count = typeof data.count === "number" ? data.count : 0;
    const windowExpired = !windowStartedAtMs || nowMs - windowStartedAtMs >= options.windowMs;
    const nextCount = windowExpired ? 1 : count + 1;

    if (!windowExpired && count >= options.maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((options.windowMs - (nowMs - windowStartedAtMs)) / 1000));
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Please wait about ${retryAfterSeconds} seconds and try again.`
      );
    }

    transaction.set(limitRef, {
      userId: options.userId,
      action: options.action,
      count: nextCount,
      windowStartedAtMs: windowExpired ? nowMs : windowStartedAtMs,
      expiresAt: Timestamp.fromMillis((windowExpired ? nowMs : windowStartedAtMs) + options.windowMs),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "rate-limiter"
    }, { merge: true });
  });
}

function cleanUserText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, limit) : "";
}

function cleanContactEmail(value: unknown) {
  const email = cleanUserText(value, 160).toLowerCase();

  if (!email) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid contact email address.");
  }

  return email;
}

async function writeOperationalLog(options: {
  severity: LogSeverity;
  eventName: string;
  message: string;
  correlationId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const logPayload = {
    service: "readnest-functions",
    ...options,
    timestamp: new Date().toISOString()
  };

  if (options.severity === "error") {
    console.error(logPayload);
  } else if (options.severity === "warning") {
    console.warn(logPayload);
  } else {
    console.info(logPayload);
  }

  try {
    await getFirestore().collection("systemLogs").add({
      ...logPayload,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "readnest-functions"
    });
  } catch (error) {
    console.warn({
      service: "readnest-functions",
      eventName: "system_log_write_failed",
      message: error instanceof Error ? error.message : "Failed to write operational log.",
      originalEventName: options.eventName
    });
  }
}

function firestoreConsoleUrl(collectionPath: string, documentId: string) {
  const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? "readnest-f9c67";
  const encodedPath = encodeURIComponent(`${collectionPath}/${documentId}`).replaceAll("%2F", "~2F");

  return `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/data/${encodedPath}`;
}

function stripeClient() {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2025-08-27.basil"
  });
}

function tierFromPrice(priceId?: string | null): SubscriptionTier {
  if (!priceId) {
    return "free";
  }

  if (priceId === process.env.STRIPE_TEACHER_PRO_PRICE_ID) {
    return "teacherPro";
  }

  if (priceId === process.env.STRIPE_FAMILY_PLUS_PRICE_ID) {
    return "familyPlus";
  }

  return "free";
}

function statusFromStripe(status?: Stripe.Subscription.Status | null): SubscriptionStatus {
  if (status === "active" || status === "trialing") {
    return "active";
  }

  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return "pastDue";
  }

  if (status === "canceled" || status === "incomplete_expired") {
    return "canceled";
  }

  return "free";
}

async function findUserIdForCustomer(customerId: string) {
  const snapshot = await getFirestore()
    .collection("subscriptions")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  return snapshot.docs[0]?.id ?? null;
}

async function writeSubscription(userId: string, data: Record<string, unknown>, eventId: string) {
  const db = getFirestore();

  await db.doc(`subscriptions/${userId}`).set(
    {
      ...data,
      userId,
      source: "stripe",
      lastStripeEventId: eventId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "stripe-webhook"
    },
    { merge: true }
  );
}

async function setSubscriptionClaim(userId: string, tier: SubscriptionTier, status: SubscriptionStatus) {
  const user = await getAuth().getUser(userId);
  const existingClaims = user.customClaims ?? {};

  await getAuth().setCustomUserClaims(userId, {
    ...existingClaims,
    subscriptionTier: tier,
    subscriptionStatus: status,
    hasFamilyPlus: tier === "familyPlus" && status === "active",
    hasTeacherPro: tier === "teacherPro" && status === "active"
  });
}

function priceIdForTier(tier: SubscriptionTier) {
  if (tier === "familyPlus") {
    return process.env.STRIPE_FAMILY_PLUS_PRICE_ID;
  }

  if (tier === "teacherPro") {
    return process.env.STRIPE_TEACHER_PRO_PRICE_ID;
  }

  return null;
}

function positiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function safeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function timestampMillis(value: unknown) {
  if (!value) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Date.parse(value) || 0;
  }

  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date ? date.getTime() : 0;
  }

  return 0;
}

async function isAssignedTeacher(teacherId: string, studentId: string) {
  const link = await getFirestore().doc(`teacherStudentLinks/${teacherId}_${studentId}`).get();
  return link.exists && link.data()?.status === "active";
}

async function assertCanRequestStudentInsight(requesterId: string, studentId: string) {
  if (requesterId === studentId) {
    return;
  }

  if (await isAssignedTeacher(requesterId, studentId)) {
    return;
  }

  const requester = await getFirestore().doc(`users/${requesterId}`).get();

  if (requester.data()?.role === "admin") {
    return;
  }

  throw new HttpsError("permission-denied", "Only assigned teachers, admins, or the student account can request this insight.");
}

function estimateOpenAiCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1_000_000) * aiEstimatedInputTokenCostPerMillionUsd;
  const outputCost = (outputTokens / 1_000_000) * aiEstimatedOutputTokenCostPerMillionUsd;
  const total = inputCost + outputCost;

  return Math.round(total * 10000) / 10000;
}

async function createAiAnalysisJob(options: {
  studentId: string;
  requestedBy: string;
  requestKind: AiJobRequestKind;
  consentAccepted: boolean;
  source?: string;
  queuedReason?: string;
}) {
  const createdAt = FieldValue.serverTimestamp();
  const jobRef = await getFirestore().collection("aiAnalysisJobs").add({
    studentId: options.studentId,
    requestedBy: options.requestedBy,
    requestKind: options.requestKind,
    consentAccepted: options.consentAccepted,
    source: options.source ?? "readnest-backend",
    queuedReason: options.queuedReason ?? null,
    status: "queued",
    attempts: 0,
    createdAt,
    updatedAt: createdAt,
    createdBy: options.requestedBy,
    updatedBy: options.requestedBy
  });

  await getFirestore().doc(`users/${options.studentId}/learningCoachState/current`).set({
    studentId: options.studentId,
    activeJobId: jobRef.id,
    activeJobStatus: "queued",
    activeJobRequestKind: options.requestKind,
    lastQueuedAt: createdAt,
    queuedReason: options.queuedReason ?? null,
    updatedAt: createdAt,
    updatedBy: options.requestedBy
  }, { merge: true });

  return jobRef.id;
}

async function runAiAnalysisJob(jobId: string, job: DocumentData) {
  const db = getFirestore();
  const studentId = typeof job.studentId === "string" ? job.studentId : "";

  if (!studentId) {
    await writeOperationalLog({
      severity: "error",
      eventName: "ai_job_invalid",
      message: "AI job is missing studentId.",
      correlationId: jobId,
      resourceType: "aiAnalysisJobs",
      resourceId: jobId
    });
    await db.doc(`aiAnalysisJobs/${jobId}`).set({
      status: "failed",
      error: "Missing studentId",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-worker"
    }, { merge: true });
    return;
  }

  await writeOperationalLog({
    severity: "info",
    eventName: "ai_job_started",
    message: "AI analysis job started.",
    correlationId: jobId,
    resourceType: "aiAnalysisJobs",
    resourceId: jobId,
    metadata: {
      studentId,
      requestKind: job.requestKind ?? null
    }
  });

  const runningAt = FieldValue.serverTimestamp();
  await db.doc(`aiAnalysisJobs/${jobId}`).set({
    status: "running",
    attempts: FieldValue.increment(1),
    startedAt: runningAt,
    updatedAt: runningAt,
    updatedBy: "ai-worker"
  }, { merge: true });
  await db.doc(`users/${studentId}/learningCoachState/current`).set({
    studentId,
    activeJobId: jobId,
    activeJobStatus: "running",
    updatedAt: runningAt,
    updatedBy: "ai-worker"
  }, { merge: true });

  try {
    const events = await loadRecentLearningEvents(db, studentId);
    const summary = summarizeLearningEvents(studentId, events);
    let insight = buildRuleBasedInsight(summary);
    let provider = "rule-based";
    let providerError: string | null = null;
    let budgetDecision: AiBudgetDecision | null = null;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let actualCostUsd: number | null = null;

    try {
      const apiKey = openAiApiKey.value();

      if (apiKey) {
        budgetDecision = await reserveAiBudget(db, {
          jobId,
          studentId,
          model: aiModel,
          estimatedCostUsd: aiEstimatedCostPerInsightUsd,
          warningLimitUsd: aiWarningLimitUsd,
          hardLimitUsd: aiMonthlyLimitUsd
        });

        if (budgetDecision.allowed) {
          const result = await buildOpenAiInsight({ apiKey, model: aiModel, summary });
          insight = result.insight;
          inputTokens = result.inputTokens;
          outputTokens = result.outputTokens;
          actualCostUsd = estimateOpenAiCost(result.inputTokens, result.outputTokens);
          provider = budgetDecision.mode === "warning" ? "openai-warning" : "openai";

          await recordAiBudgetActual(db, {
            jobId,
            monthKey: budgetDecision.monthKey,
            actualCostUsd: actualCostUsd || budgetDecision.reservedUsd,
            estimatedCostUsd: budgetDecision.reservedUsd,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens
          });
        } else {
          provider = "budget-fallback";
          providerError = `Monthly AI budget limit reached (${budgetDecision.estimatedMonthlySpendUsd}/${budgetDecision.hardLimitUsd} USD).`;
          await writeOperationalLog({
            severity: "warning",
            eventName: "ai_budget_fallback",
            message: providerError,
            correlationId: jobId,
            resourceType: "aiAnalysisJobs",
            resourceId: jobId,
            metadata: {
              studentId,
              monthKey: budgetDecision.monthKey
            }
          });
        }
      }
    } catch (error) {
      providerError = error instanceof Error ? error.message : "OpenAI provider failed";
      await writeOperationalLog({
        severity: "warning",
        eventName: "ai_provider_fallback",
        message: "OpenAI insight generation failed; using rule-based fallback.",
        correlationId: jobId,
        resourceType: "aiAnalysisJobs",
        resourceId: jobId,
        metadata: { studentId, providerError }
      });
    }

    const insightId = await writeStudentInsight(db, studentId, summary, insight);

    await db.doc(`aiAnalysisJobs/${jobId}`).set({
      status: "succeeded",
      insightId,
      provider,
      providerError,
      model: insight.model,
      budget: budgetDecision,
      inputTokens,
      outputTokens,
      actualCostUsd,
      sourceEventCount: events.length,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-worker"
    }, { merge: true });
    await writeOperationalLog({
      severity: "info",
      eventName: "ai_job_succeeded",
      message: "AI analysis job completed.",
      correlationId: jobId,
      resourceType: "aiAnalysisJobs",
      resourceId: jobId,
      metadata: {
        studentId,
        insightId,
        provider,
        sourceEventCount: events.length
      }
    });
  } catch (error) {
    const failedAt = FieldValue.serverTimestamp();
    await db.doc(`aiAnalysisJobs/${jobId}`).set({
      status: "failed",
      error: error instanceof Error ? error.message : "Insight processing failed",
      updatedAt: failedAt,
      updatedBy: "ai-worker"
    }, { merge: true });
    await db.doc(`users/${studentId}/learningCoachState/current`).set({
      studentId,
      activeJobId: jobId,
      activeJobStatus: "failed",
      lastError: error instanceof Error ? error.message : "Insight processing failed",
      updatedAt: failedAt,
      updatedBy: "ai-worker"
    }, { merge: true });
    await writeOperationalLog({
      severity: "error",
      eventName: "ai_job_failed",
      message: error instanceof Error ? error.message : "Insight processing failed",
      correlationId: jobId,
      resourceType: "aiAnalysisJobs",
      resourceId: jobId,
      metadata: { studentId }
    });
    throw error;
  }
}

async function handleSubscription(subscription: Stripe.Subscription, eventId: string) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId = subscription.metadata.firebaseUid || await findUserIdForCustomer(customerId);
  const firstItem = subscription.items.data[0];
  const tier = tierFromPrice(firstItem?.price.id);
  const status = statusFromStripe(subscription.status);

  if (!userId) {
    await writeOperationalLog({
      severity: "warning",
      eventName: "stripe_subscription_unmapped",
      message: "Stripe subscription event has no mapped Firebase user.",
      correlationId: eventId,
      resourceType: "stripeEvent",
      resourceId: eventId,
      metadata: {
        customerId,
        subscriptionId: subscription.id
      }
    });
    return;
  }

  await writeSubscription(
    userId,
    {
      tier,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: firstItem?.current_period_end ? firstItem.current_period_end * 1000 : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      lastPaymentError: null
    },
    eventId
  );
  await setSubscriptionClaim(userId, tier, status);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.metadata?.firebaseUid || session.client_reference_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!userId || !customerId) {
    await writeOperationalLog({
      severity: "warning",
      eventName: "stripe_checkout_missing_user",
      message: "Checkout completed without Firebase user metadata.",
      correlationId: eventId,
      resourceType: "stripeEvent",
      resourceId: eventId,
      metadata: { sessionId: session.id }
    });
    return;
  }

  if (subscriptionId) {
    const subscription = await stripeClient().subscriptions.retrieve(subscriptionId);
    await handleSubscription(subscription, eventId);
    return;
  }

  await writeSubscription(userId, {
    tier: "free",
    status: "checkoutStarted",
    stripeCustomerId: customerId,
    stripeSubscriptionId: null
  }, eventId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const userId = customerId ? await findUserIdForCustomer(customerId) : null;

  if (!userId) {
    await writeOperationalLog({
      severity: "warning",
      eventName: "stripe_invoice_failure_unmapped",
      message: "Invoice failure has no mapped Firebase user.",
      correlationId: eventId,
      resourceType: "stripeEvent",
      resourceId: eventId,
      metadata: { invoiceId: invoice.id }
    });
    return;
  }

  await writeSubscription(userId, {
    status: "pastDue",
    lastPaymentError: invoice.last_finalization_error?.message ?? "invoice.payment_failed"
  }, eventId);
}

async function handleRefundOrDispute(charge: Stripe.Charge, eventId: string, status: SubscriptionStatus) {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  const userId = customerId ? await findUserIdForCustomer(customerId) : null;

  if (!userId) {
    await writeOperationalLog({
      severity: "warning",
      eventName: "stripe_charge_unmapped",
      message: "Refund or dispute has no mapped Firebase user.",
      correlationId: eventId,
      resourceType: "stripeEvent",
      resourceId: eventId,
      metadata: { chargeId: charge.id }
    });
    return;
  }

  await writeSubscription(userId, {
    status,
    lastPaymentError: status === "canceled" ? "refund_or_dispute" : "payment_dispute"
  }, eventId);
}

async function handleDispute(dispute: Stripe.Dispute, eventId: string) {
  if (!dispute.charge || typeof dispute.charge !== "string") {
    await writeOperationalLog({
      severity: "warning",
      eventName: "stripe_dispute_missing_charge",
      message: "Dispute event has no charge id.",
      correlationId: eventId,
      resourceType: "stripeEvent",
      resourceId: eventId,
      metadata: { disputeId: dispute.id }
    });
    return;
  }

  const charge = await stripeClient().charges.retrieve(dispute.charge);
  await handleRefundOrDispute(charge, eventId, "pastDue");
}

export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    region: "us-central1",
    cors: false
  },
  async (request, response) => {
    const signature = request.header("stripe-signature");

    if (!signature) {
      response.status(400).send("Missing Stripe signature");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripeClient().webhooks.constructEvent(
        request.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (error) {
      response.status(400).send(`Invalid Stripe signature: ${error instanceof Error ? error.message : "unknown error"}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscription(event.data.object as Stripe.Subscription, event.id);
          break;
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id);
          break;
        case "charge.refunded":
          await handleRefundOrDispute(event.data.object as Stripe.Charge, event.id, "canceled");
          break;
        case "charge.dispute.created":
          await handleDispute(event.data.object as Stripe.Dispute, event.id);
          break;
        default:
          break;
      }

      await writeOperationalLog({
        severity: "info",
        eventName: "stripe_webhook_processed",
        message: "Stripe webhook event processed.",
        correlationId: event.id,
        resourceType: "stripeEvent",
        resourceId: event.id,
        metadata: { type: event.type }
      });
      response.status(200).json({ received: true });
    } catch (error) {
      await writeOperationalLog({
        severity: "error",
        eventName: "stripe_webhook_failed",
        message: error instanceof Error ? error.message : "Stripe webhook handling failed.",
        correlationId: event.id,
        resourceType: "stripeEvent",
        resourceId: event.id,
        metadata: { type: event.type }
      });
      response.status(500).send("Webhook handling failed");
    }
  }
);

export const createBillingPortalSession = onCall(
  {
    secrets: [stripeSecretKey],
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before managing billing.");
    }

    await enforceUserRateLimit({
      userId: request.auth.uid,
      action: "billingPortal",
      maxAttempts: 6,
      windowMs: 10 * 60 * 1000
    });

    const subscription = await getFirestore().doc(`subscriptions/${request.auth.uid}`).get();
    const stripeCustomerId = subscription.data()?.stripeCustomerId;

    if (!stripeCustomerId || typeof stripeCustomerId !== "string") {
      throw new HttpsError("failed-precondition", "No Stripe customer is linked to this account yet.");
    }

    const session = await stripeClient().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appBaseUrl}#/account`
    });

    return { url: session.url };
  }
);

export const createCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before starting checkout.");
    }

    await enforceUserRateLimit({
      userId: request.auth.uid,
      action: "checkout",
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000
    });

    const requestedTier = request.data?.tier;

    if (requestedTier !== "familyPlus" && requestedTier !== "teacherPro") {
      throw new HttpsError("invalid-argument", "Choose Family Plus or Teacher Pro.");
    }

    const db = getFirestore();
    const userId = request.auth.uid;
    const userDoc = await db.doc(`users/${userId}`).get();
    const userProfile = userDoc.data() ?? {};
    const role = typeof userProfile.role === "string" ? userProfile.role : "";

    if (!userDoc.exists || (role !== "student" && role !== "teacher" && role !== "admin")) {
      throw new HttpsError("failed-precondition", "Finish account setup before starting checkout.");
    }

    if (requestedTier === "familyPlus" && role !== "student") {
      throw new HttpsError("permission-denied", "Family Plus is only available for student or parent accounts.");
    }

    if (requestedTier === "teacherPro" && role !== "teacher" && role !== "admin") {
      throw new HttpsError("permission-denied", "Teacher Pro is only available for teacher accounts.");
    }

    const priceId = priceIdForTier(requestedTier);

    if (!priceId) {
      throw new HttpsError("failed-precondition", "Stripe price ID is not configured for this plan.");
    }

    const stripe = stripeClient();
    const subscriptionRef = db.doc(`subscriptions/${userId}`);
    const subscriptionDoc = await subscriptionRef.get();
    let stripeCustomerId = subscriptionDoc.data()?.stripeCustomerId;

    if (typeof stripeCustomerId !== "string" || !stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: typeof userProfile.email === "string" ? userProfile.email : (request.auth.token.email as string | undefined),
        name: typeof userProfile.displayName === "string" ? userProfile.displayName : undefined,
        metadata: {
          firebaseUid: userId,
          role
        }
      });
      stripeCustomerId = customer.id;
    }

    await subscriptionRef.set({
      userId,
      tier: requestedTier,
      status: "checkoutStarted",
      source: "stripe",
      stripeCustomerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    }, { merge: true });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: `${appBaseUrl}#/account`,
      cancel_url: `${appBaseUrl}#/account`,
      metadata: {
        firebaseUid: userId,
        tier: requestedTier,
        role
      },
      subscription_data: {
        metadata: {
          firebaseUid: userId,
          tier: requestedTier,
          role
        }
      }
    });

    if (!session.url) {
      throw new HttpsError("internal", "Stripe did not return a checkout URL.");
    }

    await writeOperationalLog({
      severity: "info",
      eventName: "stripe_checkout_session_created",
      message: "Stripe checkout session created.",
      correlationId: session.id,
      resourceType: "subscriptions",
      resourceId: userId,
      metadata: {
        tier: requestedTier,
        role
      }
    });

    return { url: session.url };
  }
);

export const claimPlacementStudent = onCall(
  {
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in as a teacher before claiming a student.");
    }

    const teacherId = request.auth.uid;
    await enforceUserRateLimit({
      userId: teacherId,
      action: "claimStudent",
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000
    });

    const studentId = typeof request.data?.studentId === "string" ? request.data.studentId.trim() : "";

    if (!studentId || studentId === teacherId) {
      throw new HttpsError("invalid-argument", "Choose a valid unassigned student.");
    }

    const db = getFirestore();
    const studentAuth = await getAuth().getUser(studentId);
    const teacherRef = db.doc(`users/${teacherId}`);
    const teacherProfileRef = db.doc(`teacherProfiles/${teacherId}`);
    const teacherDirectoryRef = db.doc(`teacherDirectory/${teacherId}`);
    const queueRef = db.doc(`studentPlacementQueue/${studentId}`);
    const linkRef = db.doc(`teacherStudentLinks/${teacherId}_${studentId}`);

    await db.runTransaction(async (transaction: Transaction) => {
      const [teacherDoc, teacherProfileDoc, teacherDirectoryDoc, queueDoc, existingLinkDoc] = await Promise.all([
        transaction.get(teacherRef),
        transaction.get(teacherProfileRef),
        transaction.get(teacherDirectoryRef),
        transaction.get(queueRef),
        transaction.get(linkRef)
      ]);

      const teacher = teacherDoc.data() ?? {};
      const teacherProfile = teacherProfileDoc.data() ?? {};
      const teacherDirectory = teacherDirectoryDoc.data() ?? {};
      const role = teacher.role;

      if (role !== "teacher" && role !== "admin") {
        throw new HttpsError("permission-denied", "Only teacher accounts can claim unassigned students.");
      }

      const queue = queueDoc.data();

      if (!queueDoc.exists || queue?.status !== "unassigned") {
        throw new HttpsError("failed-precondition", "This student is no longer in the unassigned holding space.");
      }

      if (existingLinkDoc.exists && existingLinkDoc.data()?.status === "active") {
        return;
      }

      const maxStudentLoad =
        positiveNumber(teacherProfile.maxStudentLoad)
        ?? positiveNumber(teacherDirectory.maxStudentLoad)
        ?? defaultTeacherCapacity;
      const activeStudentCount =
        positiveNumber(teacherDirectory.activeStudentCount)
        ?? positiveNumber(teacherProfile.activeStudentCount)
        ?? 0;

      if (activeStudentCount >= maxStudentLoad) {
        throw new HttpsError("resource-exhausted", `This teacher already has ${maxStudentLoad} active students.`);
      }

      const teacherName = safeString(teacherProfile.displayName, safeString(teacherDirectory.displayName, "Teacher"));
      const teacherEmail = typeof teacherProfile.email === "string"
        ? teacherProfile.email
        : typeof teacherDirectory.email === "string"
          ? teacherDirectory.email
          : null;
      const studentName = safeString(queue.studentName, "Student");
      const studentEmail = studentAuth.email ?? null;
      const latestProgressSnapshot = queue.latestProgressSnapshot ?? null;
      const now = FieldValue.serverTimestamp();

      transaction.set(linkRef, {
        teacherId,
        teacherName,
        teacherEmail,
        studentId,
        studentName,
        studentEmail,
        status: "active",
        latestProgressSnapshot,
        requestedAt: queue.createdAt ?? now,
        updatedAt: now,
        createdBy: "placement-queue",
        updatedBy: teacherId
      }, { merge: true });

      transaction.set(queueRef, {
        status: "assigned",
        assignedTeacherId: teacherId,
        assignedTeacherName: teacherName,
        holdingTeacherName: null,
        assignedAt: now,
        updatedAt: now,
        updatedBy: teacherId
      }, { merge: true });

      transaction.set(teacherDirectoryRef, {
        activeStudentCount: FieldValue.increment(1),
        updatedAt: now,
        updatedBy: teacherId
      }, { merge: true });

      transaction.set(teacherProfileRef, {
        activeStudentCount: FieldValue.increment(1),
        updatedAt: now,
        updatedBy: teacherId
      }, { merge: true });
    });

    return {
      linkId: `${teacherId}_${studentId}`,
      status: "active"
    };
  }
);

export const updateTeacherAssignmentStatus = onCall(
  {
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in as a teacher before updating a student request.");
    }

    const teacherId = request.auth.uid;
    const linkId = cleanUserText(request.data?.linkId, 160);
    const nextStatus = cleanUserText(request.data?.status, 20);

    if (!linkId || (nextStatus !== "active" && nextStatus !== "declined")) {
      throw new HttpsError("invalid-argument", "Choose a valid student request and status.");
    }

    await enforceUserRateLimit({
      userId: teacherId,
      action: "manageAssignment",
      maxAttempts: 20,
      windowMs: 10 * 60 * 1000
    });

    const db = getFirestore();
    const teacherRef = db.doc(`users/${teacherId}`);
    const teacherProfileRef = db.doc(`teacherProfiles/${teacherId}`);
    const teacherDirectoryRef = db.doc(`teacherDirectory/${teacherId}`);
    const linkRef = db.doc(`teacherStudentLinks/${linkId}`);

    await db.runTransaction(async (transaction) => {
      const [teacherDoc, teacherProfileDoc, teacherDirectoryDoc, linkDoc] = await Promise.all([
        transaction.get(teacherRef),
        transaction.get(teacherProfileRef),
        transaction.get(teacherDirectoryRef),
        transaction.get(linkRef)
      ]);
      const teacher = teacherDoc.data() ?? {};
      const link = linkDoc.data() ?? {};

      if (!linkDoc.exists || link.teacherId !== teacherId) {
        throw new HttpsError("permission-denied", "This student request is not assigned to your teacher account.");
      }

      if (teacher.role !== "teacher" && teacher.role !== "admin") {
        throw new HttpsError("permission-denied", "Only teacher accounts can manage student requests.");
      }

      if (link.status !== "requested" && link.status !== nextStatus) {
        throw new HttpsError("failed-precondition", "This student request has already been resolved.");
      }

      const teacherProfile = teacherProfileDoc.data() ?? {};
      const teacherDirectory = teacherDirectoryDoc.data() ?? {};
      const maxStudentLoad =
        positiveNumber(teacherProfile.maxStudentLoad)
        ?? positiveNumber(teacherDirectory.maxStudentLoad)
        ?? defaultTeacherCapacity;
      const activeStudentCount =
        positiveNumber(teacherDirectory.activeStudentCount)
        ?? positiveNumber(teacherProfile.activeStudentCount)
        ?? 0;
      const isActivating = nextStatus === "active" && link.status !== "active";

      if (isActivating && activeStudentCount >= maxStudentLoad) {
        throw new HttpsError("resource-exhausted", `This teacher already has ${maxStudentLoad} active students.`);
      }

      const now = FieldValue.serverTimestamp();
      transaction.set(linkRef, {
        status: nextStatus,
        updatedAt: now,
        updatedBy: teacherId
      }, { merge: true });

      const studentId = typeof link.studentId === "string" ? link.studentId : "";

      if (studentId) {
        const queueRef = db.doc(`studentPlacementQueue/${studentId}`);

        if (nextStatus === "active") {
          transaction.set(queueRef, {
            status: "assigned",
            assignedTeacherId: teacherId,
            assignedTeacherName: safeString(link.teacherName, safeString(teacherProfile.displayName, "Teacher")),
            holdingTeacherName: null,
            assignedAt: now,
            updatedAt: now,
            updatedBy: teacherId
          }, { merge: true });
        } else {
          transaction.set(queueRef, {
            status: "unassigned",
            requestedTeacherId: null,
            requestedTeacherName: null,
            holdingTeacherName: "ReadNest holding space",
            updatedAt: now,
            updatedBy: teacherId
          }, { merge: true });
        }
      }

      if (isActivating) {
        transaction.set(teacherDirectoryRef, {
          activeStudentCount: FieldValue.increment(1),
          updatedAt: now,
          updatedBy: teacherId
        }, { merge: true });
        transaction.set(teacherProfileRef, {
          activeStudentCount: FieldValue.increment(1),
          updatedAt: now,
          updatedBy: teacherId
        }, { merge: true });
      }
    });

    if (nextStatus === "active") {
      const link = await linkRef.get();
      const studentId = typeof link.data()?.studentId === "string" ? link.data()?.studentId : "";

      if (studentId) {
        const competingRequests = await db.collection("teacherStudentLinks")
          .where("studentId", "==", studentId)
          .get();
        const batch = db.batch();

        competingRequests.docs.forEach((requestDoc) => {
          if (requestDoc.id !== linkId && requestDoc.data().status === "requested") {
            batch.set(requestDoc.ref, {
              status: "declined",
              updatedAt: FieldValue.serverTimestamp(),
              updatedBy: "assignment-worker"
            }, { merge: true });
          }
        });

        if (!competingRequests.empty) {
          await batch.commit();
        }
      }
    }

    return { linkId, status: nextStatus };
  }
);

export const requestStudentInsight = onCall(
  {
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before requesting recommendations.");
    }

    await enforceUserRateLimit({
      userId: request.auth.uid,
      action: "studentInsight",
      maxAttempts: 4,
      windowMs: 60 * 60 * 1000
    });

    const consentAccepted = request.data?.consentAccepted === true;
    const studentId = typeof request.data?.studentId === "string" ? request.data.studentId : request.auth.uid;

    if (!consentAccepted) {
      throw new HttpsError("failed-precondition", "Parent or teacher consent is required before AI-assisted recommendations.");
    }

    await assertCanRequestStudentInsight(request.auth.uid, studentId);
    const jobId = await createAiAnalysisJob({
      studentId,
      requestedBy: request.auth.uid,
      requestKind: "teacherRequested",
      consentAccepted
    });

    return {
      jobId,
      status: "queued",
      message: "Insight request recorded. The backend worker will generate an evidence-based summary asynchronously."
    };
  }
);

export const createLearningRecommendation = onCall(
  {
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before requesting recommendations.");
    }

    await enforceUserRateLimit({
      userId: request.auth.uid,
      action: "learningRecommendation",
      maxAttempts: 4,
      windowMs: 60 * 60 * 1000
    });

    const consentAccepted = request.data?.consentAccepted === true;

    if (!consentAccepted) {
      throw new HttpsError("failed-precondition", "Parent or teacher consent is required before AI-assisted recommendations.");
    }

    const jobId = await createAiAnalysisJob({
      studentId: request.auth.uid,
      requestedBy: request.auth.uid,
      requestKind: "legacyRecommendation",
      consentAccepted,
      source: "legacy-callable"
    });

    return {
      jobId,
      status: "queued",
      message: "Recommendation request recorded. The backend worker will generate an evidence-based summary asynchronously."
    };
  }
);

export const submitSupportCase = onCall(
  {
    region: "us-central1",
    enforceAppCheck
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before contacting support.");
    }

    if (cleanUserText(request.data?.website, 200)) {
      throw new HttpsError("invalid-argument", "Could not submit this request.");
    }

    await enforceUserRateLimit({
      userId: request.auth.uid,
      action: "supportCase",
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000
    });

    const type = cleanUserText(request.data?.type, 32);
    const subject = cleanUserText(request.data?.subject, 120);
    const message = cleanUserText(request.data?.message, 1200);
    const contactEmail = cleanContactEmail(request.data?.contactEmail ?? request.auth.token.email);
    const allowedTypes = new Set(["general", "billing", "dataDeletion", "teacherVerification", "technical"]);

    if (!allowedTypes.has(type)) {
      throw new HttpsError("invalid-argument", "Choose a valid support request type.");
    }

    if (subject.length < 3 || message.length < 10) {
      throw new HttpsError("invalid-argument", "Add a short subject and at least 10 characters of detail.");
    }

    const caseRef = getFirestore().collection("supportCases").doc();
    const now = FieldValue.serverTimestamp();
    await caseRef.set({
      userId: request.auth.uid,
      type,
      subject,
      message,
      contactEmail,
      status: "open",
      createdAt: now,
      updatedAt: now,
      createdBy: request.auth.uid,
      updatedBy: request.auth.uid,
      source: "callable"
    });

    return { caseId: caseRef.id };
  }
);

export const updateLearningCoachState = onDocumentCreated(
  {
    document: "users/{studentId}/learningEvents/{eventId}",
    region: "us-central1"
  },
  async (event) => {
    const studentId = event.params.studentId;
    const db = getFirestore();
    const stateRef = db.doc(`users/${studentId}/learningCoachState/current`);
    const userRef = db.doc(`users/${studentId}`);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const [userDoc, stateDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(stateRef)
      ]);
      const profile = userDoc.data() ?? {};
      const state = stateDoc.data() ?? {};
      const nextEventCount = positiveNumber(state.eventsSinceLastInsight) ?? 0;
      const eventsSinceLastInsight = nextEventCount + 1;
      const activeJobStatus = typeof state.activeJobStatus === "string" ? state.activeJobStatus : "";
      const hasActiveJob = activeJobStatus === "queued" || activeJobStatus === "running";
      const lastQueuedAt = timestampMillis(state.lastQueuedAt);
      const cooldownHasPassed = Date.now() - lastQueuedAt >= learningCoachCooldownMs;
      const consentAccepted = profile.parentConsentAccepted === true || profile.aiRecommendationsConsentAccepted === true;
      const shouldQueue =
        consentAccepted
        && !hasActiveJob
        && eventsSinceLastInsight >= learningCoachThresholdEvents
        && cooldownHasPassed;

      transaction.set(stateRef, {
        studentId,
        status: shouldQueue ? "queued" : "collecting",
        activeJobStatus: shouldQueue ? "queued" : activeJobStatus || null,
        eventsSinceLastInsight,
        lastEventId: event.params.eventId,
        lastEventAt: now,
        thresholdEvents: learningCoachThresholdEvents,
        cooldownHours: learningCoachCooldownMs / 1000 / 60 / 60,
        consentAccepted,
        updatedAt: now,
        updatedBy: "learning-event-trigger"
      }, { merge: true });

      if (shouldQueue) {
        const jobRef = db.collection("aiAnalysisJobs").doc();
        transaction.set(jobRef, {
          studentId,
          requestedBy: "learning-event-trigger",
          requestKind: "thresholdTriggered",
          consentAccepted: true,
          source: "learning-event-threshold",
          queuedReason: `${eventsSinceLastInsight} new learning events since the last coach insight.`,
          status: "queued",
          attempts: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: "learning-event-trigger",
          updatedBy: "learning-event-trigger"
        });
        transaction.set(stateRef, {
          activeJobId: jobRef.id,
          activeJobStatus: "queued",
          activeJobRequestKind: "thresholdTriggered",
          lastQueuedAt: now,
          queuedReason: `${eventsSinceLastInsight} new learning events since the last coach insight.`,
          updatedAt: now,
          updatedBy: "learning-event-trigger"
        }, { merge: true });
      }
    });
  }
);

export const processSupportCase = onDocumentCreated(
  {
    document: "supportCases/{caseId}",
    region: "us-central1",
    secrets: [openAiApiKey, resendApiKey],
    retry: true
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const caseId = event.params.caseId;
    const supportCase = snapshot.data();
    const db = getFirestore();
    const detailUrl = firestoreConsoleUrl("supportCases", caseId);

    await writeOperationalLog({
      severity: "info",
      eventName: "support_case_received",
      message: "Support case received for backend processing.",
      correlationId: caseId,
      resourceType: "supportCases",
      resourceId: caseId,
      metadata: {
        type: supportCase.type ?? null,
        userId: supportCase.userId ?? null
      }
    });

    try {
      await snapshot.ref.set({
        aiSummaryStatus: "processing",
        emailNotificationStatus: "pending",
        adminDetailUrl: detailUrl,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "support-case-worker"
      }, { merge: true });

      let openAiKey = "";
      let resendKey = "";

      try {
        openAiKey = openAiApiKey.value();
      } catch {
        openAiKey = "";
      }

      try {
        resendKey = resendApiKey.value();
      } catch {
        resendKey = "";
      }

      const summaryResult = await summarizeSupportCase({
        apiKey: openAiKey,
        model: aiModel,
        supportCase: {
          id: caseId,
          userId: typeof supportCase.userId === "string" ? supportCase.userId : "unknown",
          type: typeof supportCase.type === "string" ? supportCase.type : "general",
          subject: typeof supportCase.subject === "string" ? supportCase.subject : "Support request",
          message: typeof supportCase.message === "string" ? supportCase.message : "",
          contactEmail: typeof supportCase.contactEmail === "string" ? supportCase.contactEmail : null
        }
      });

      await snapshot.ref.set({
        aiSummaryStatus: "ready",
        aiSummaryProvider: summaryResult.provider,
        aiSummaryProviderError: summaryResult.providerError,
        aiSummary: summaryResult.summary.summary,
        aiUrgency: summaryResult.summary.urgency,
        aiCategory: summaryResult.summary.category,
        aiRecommendedNextSteps: summaryResult.summary.recommendedNextSteps,
        aiCustomerReplyDraft: summaryResult.summary.customerReplyDraft,
        aiSafetyFlags: summaryResult.summary.safetyFlags,
        adminDetailUrl: detailUrl,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "support-case-worker"
      }, { merge: true });

      await writeOperationalLog({
        severity: summaryResult.providerError ? "warning" : "info",
        eventName: "support_case_summarized",
        message: summaryResult.providerError ? "Support case summarized with fallback." : "Support case summarized.",
        correlationId: caseId,
        resourceType: "supportCases",
        resourceId: caseId,
        metadata: {
          provider: summaryResult.provider,
          providerError: summaryResult.providerError,
          urgency: summaryResult.summary.urgency
        }
      });

      try {
        const emailResult = await sendSupportSummaryEmail({
          resendApiKey: resendKey,
          fromEmail: supportFromEmail,
          toEmail: supportNotificationEmail,
          supportCase: {
            id: caseId,
            userId: typeof supportCase.userId === "string" ? supportCase.userId : "unknown",
            type: typeof supportCase.type === "string" ? supportCase.type : "general",
            subject: typeof supportCase.subject === "string" ? supportCase.subject : "Support request",
            message: typeof supportCase.message === "string" ? supportCase.message : "",
            contactEmail: typeof supportCase.contactEmail === "string" ? supportCase.contactEmail : null
          },
          summary: summaryResult.summary,
          detailUrl
        });

        await snapshot.ref.set({
          emailNotificationStatus: emailResult.status,
          emailProviderMessage: emailResult.providerMessage,
          emailNotificationSentAt: emailResult.status === "sent" ? FieldValue.serverTimestamp() : null,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "support-case-worker"
        }, { merge: true });
        await writeOperationalLog({
          severity: emailResult.status === "sent" ? "info" : "warning",
          eventName: emailResult.status === "sent" ? "support_email_sent" : "support_email_skipped",
          message: emailResult.providerMessage,
          correlationId: caseId,
          resourceType: "supportCases",
          resourceId: caseId,
          metadata: {
            toEmail: supportNotificationEmail,
            status: emailResult.status
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Support email failed.";
        await snapshot.ref.set({
          emailNotificationStatus: "failed",
          emailProviderMessage: errorMessage,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "support-case-worker"
        }, { merge: true });
        await writeOperationalLog({
          severity: "error",
          eventName: "support_email_failed",
          message: errorMessage,
          correlationId: caseId,
          resourceType: "supportCases",
          resourceId: caseId,
          metadata: { toEmail: supportNotificationEmail }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Support case processing failed.";
      await snapshot.ref.set({
        aiSummaryStatus: "failed",
        processingError: errorMessage,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "support-case-worker"
      }, { merge: true });
      await writeOperationalLog({
        severity: "error",
        eventName: "support_case_processing_failed",
        message: errorMessage,
        correlationId: caseId,
        resourceType: "supportCases",
        resourceId: caseId
      });
      throw error;
    }
  }
);

export const processAiAnalysisJob = onDocumentCreated(
  {
    document: "aiAnalysisJobs/{jobId}",
    region: "us-central1",
    secrets: [openAiApiKey],
    retry: true
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const job = snapshot.data();

    if (job.status !== "queued") {
      return;
    }

    await runAiAnalysisJob(event.params.jobId, job);
  }
);

export const enqueueDailyInsightJobs = onSchedule(
  {
    schedule: "every day 02:30",
    timeZone: "America/New_York",
    region: "us-central1"
  },
  async () => {
    const snapshot = await getFirestore()
      .collection("teacherStudentLinks")
      .where("status", "==", "active")
      .limit(250)
      .get();
    const uniqueStudentIds: string[] = Array.from(new Set(
      snapshot.docs
        .map((doc: QueryDocumentSnapshot) => doc.data().studentId)
        .filter((studentId: unknown): studentId is string => typeof studentId === "string")
    ));

    await Promise.all(
      uniqueStudentIds.map((studentId) =>
        createAiAnalysisJob({
          studentId,
          requestedBy: "scheduler",
          requestKind: "scheduled",
          consentAccepted: true,
          source: "daily-schedule"
        })
      )
    );
  }
);
