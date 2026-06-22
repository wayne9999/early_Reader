import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import Stripe from "stripe";
import { parseBudgetLimit, recordAiBudgetActual, reserveAiBudget, type AiBudgetDecision } from "./aiBudget.js";
import { buildOpenAiInsight, buildRuleBasedInsight, loadRecentLearningEvents, summarizeLearningEvents, writeStudentInsight } from "./aiLearning.js";

initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const openAiApiKey = defineSecret("OPENAI_API_KEY");
const appBaseUrl = process.env.READNEST_APP_BASE_URL ?? "https://wayne9999.github.io/early_Reader/";
const aiModel = process.env.READNEST_AI_MODEL ?? "gpt-5.5";
const aiWarningLimitUsd = parseBudgetLimit(process.env.READNEST_AI_WARNING_LIMIT_USD, 10);
const aiMonthlyLimitUsd = parseBudgetLimit(process.env.READNEST_AI_MONTHLY_LIMIT_USD, 15);
const aiEstimatedCostPerInsightUsd = parseBudgetLimit(process.env.READNEST_AI_ESTIMATED_COST_PER_INSIGHT_USD, 0.05);
const aiEstimatedInputTokenCostPerMillionUsd = parseBudgetLimit(process.env.READNEST_AI_INPUT_COST_PER_1M_USD, 0);
const aiEstimatedOutputTokenCostPerMillionUsd = parseBudgetLimit(process.env.READNEST_AI_OUTPUT_COST_PER_1M_USD, 0);

type SubscriptionTier = "free" | "familyPlus" | "teacherPro";
type SubscriptionStatus = "free" | "checkoutStarted" | "active" | "pastDue" | "canceled";
type AiJobRequestKind = "teacherRequested" | "scheduled" | "legacyRecommendation";

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
}) {
  const createdAt = FieldValue.serverTimestamp();
  const jobRef = await getFirestore().collection("aiAnalysisJobs").add({
    studentId: options.studentId,
    requestedBy: options.requestedBy,
    requestKind: options.requestKind,
    consentAccepted: options.consentAccepted,
    source: options.source ?? "readnest-backend",
    status: "queued",
    attempts: 0,
    createdAt,
    updatedAt: createdAt,
    createdBy: options.requestedBy,
    updatedBy: options.requestedBy
  });

  return jobRef.id;
}

async function runAiAnalysisJob(jobId: string, job: DocumentData) {
  const db = getFirestore();
  const studentId = typeof job.studentId === "string" ? job.studentId : "";

  if (!studentId) {
    await db.doc(`aiAnalysisJobs/${jobId}`).set({
      status: "failed",
      error: "Missing studentId",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-worker"
    }, { merge: true });
    return;
  }

  await db.doc(`aiAnalysisJobs/${jobId}`).set({
    status: "running",
    attempts: FieldValue.increment(1),
    startedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
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
        }
      }
    } catch (error) {
      providerError = error instanceof Error ? error.message : "OpenAI provider failed";
      console.warn("OpenAI insight generation failed; using rule-based fallback", { jobId, studentId, providerError });
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
  } catch (error) {
    await db.doc(`aiAnalysisJobs/${jobId}`).set({
      status: "failed",
      error: error instanceof Error ? error.message : "Insight processing failed",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-worker"
    }, { merge: true });
    throw error;
  }
}

async function handleSubscription(subscription: Stripe.Subscription, eventId: string) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId = subscription.metadata.firebaseUid || await findUserIdForCustomer(customerId);
  const firstItem = subscription.items.data[0];
  const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end?: number };
  const tier = tierFromPrice(firstItem?.price.id);
  const status = statusFromStripe(subscription.status);

  if (!userId) {
    console.warn("Stripe subscription event has no mapped Firebase user", {
      customerId,
      eventId,
      subscriptionId: subscription.id
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
      currentPeriodEnd: subscriptionWithPeriod.current_period_end ? subscriptionWithPeriod.current_period_end * 1000 : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      lastPaymentError: null
    },
    eventId
  );
  await setSubscriptionClaim(userId, tier, status);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.metadata?.firebaseUid;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!userId || !customerId) {
    console.warn("Checkout completed without Firebase user metadata", { eventId, sessionId: session.id });
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
    console.warn("Invoice failure has no mapped Firebase user", { eventId, invoiceId: invoice.id });
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
    console.warn("Refund/dispute has no mapped Firebase user", { eventId, chargeId: charge.id });
    return;
  }

  await writeSubscription(userId, {
    status,
    lastPaymentError: status === "canceled" ? "refund_or_dispute" : "payment_dispute"
  }, eventId);
}

async function handleDispute(dispute: Stripe.Dispute, eventId: string) {
  if (!dispute.charge || typeof dispute.charge !== "string") {
    console.warn("Dispute event has no charge id", { eventId, disputeId: dispute.id });
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

      response.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe webhook handling failed", error);
      response.status(500).send("Webhook handling failed");
    }
  }
);

export const createBillingPortalSession = onCall(
  {
    secrets: [stripeSecretKey],
    region: "us-central1"
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before managing billing.");
    }

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

export const requestStudentInsight = onCall(
  {
    region: "us-central1"
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before requesting recommendations.");
    }

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
    region: "us-central1"
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before requesting recommendations.");
    }

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
    const uniqueStudentIds = [...new Set(snapshot.docs.map((doc) => doc.data().studentId).filter((studentId): studentId is string => typeof studentId === "string"))];

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
