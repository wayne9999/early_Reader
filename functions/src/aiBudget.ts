import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

export type AiBudgetDecision = {
  allowed: boolean;
  monthKey: string;
  mode: "openai" | "warning" | "fallback";
  reason: "within_budget" | "warning_limit" | "hard_limit";
  estimatedMonthlySpendUsd: number;
  warningLimitUsd: number;
  hardLimitUsd: number;
  reservedUsd: number;
};

type AiBudgetRecord = {
  estimatedSpendUsd?: number;
  calls?: number;
  openAiCalls?: number;
  fallbackCalls?: number;
};

function roundedUsd(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function currentAiBudgetMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function parseBudgetLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function reserveAiBudget(db: Firestore, options: {
  jobId: string;
  studentId: string;
  model: string;
  estimatedCostUsd: number;
  warningLimitUsd: number;
  hardLimitUsd: number;
}): Promise<AiBudgetDecision> {
  const monthKey = currentAiBudgetMonthKey();
  const monthRef = db.doc(`aiBudget/monthly/months/${monthKey}`);
  const eventRef = monthRef.collection("events").doc(options.jobId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(monthRef);
    const data = snapshot.data() as AiBudgetRecord | undefined;
    const currentSpend = typeof data?.estimatedSpendUsd === "number" ? data.estimatedSpendUsd : 0;
    const nextSpend = roundedUsd(currentSpend + options.estimatedCostUsd);
    const hardLimitReached = currentSpend >= options.hardLimitUsd || nextSpend > options.hardLimitUsd;
    const warningReached = nextSpend >= options.warningLimitUsd;
    const decision: AiBudgetDecision = {
      allowed: !hardLimitReached,
      monthKey,
      mode: hardLimitReached ? "fallback" : warningReached ? "warning" : "openai",
      reason: hardLimitReached ? "hard_limit" : warningReached ? "warning_limit" : "within_budget",
      estimatedMonthlySpendUsd: hardLimitReached ? roundedUsd(currentSpend) : nextSpend,
      warningLimitUsd: options.warningLimitUsd,
      hardLimitUsd: options.hardLimitUsd,
      reservedUsd: hardLimitReached ? 0 : roundedUsd(options.estimatedCostUsd)
    };

    const monthUpdate = {
      estimatedSpendUsd: decision.estimatedMonthlySpendUsd,
      warningLimitUsd: options.warningLimitUsd,
      hardLimitUsd: options.hardLimitUsd,
      calls: FieldValue.increment(1),
      openAiCalls: FieldValue.increment(decision.allowed ? 1 : 0),
      fallbackCalls: FieldValue.increment(decision.allowed ? 0 : 1),
      mode: decision.mode,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-budget-guard"
    };

    transaction.set(monthRef, {
      ...monthUpdate,
      monthKey,
      createdAt: snapshot.exists ? snapshot.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      createdBy: snapshot.exists ? snapshot.data()?.createdBy ?? "ai-budget-guard" : "ai-budget-guard"
    }, { merge: true });

    transaction.set(eventRef, {
      jobId: options.jobId,
      studentId: options.studentId,
      model: options.model,
      decision,
      estimatedCostUsd: decision.reservedUsd,
      status: decision.allowed ? "reserved" : "fallback",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "ai-budget-guard"
    }, { merge: true });

    return decision;
  });
}

export async function recordAiBudgetActual(db: Firestore, options: {
  jobId: string;
  monthKey: string;
  actualCostUsd: number;
  estimatedCostUsd: number;
  inputTokens?: number;
  outputTokens?: number;
}) {
  const delta = roundedUsd(options.actualCostUsd - options.estimatedCostUsd);
  const monthRef = db.doc(`aiBudget/monthly/months/${options.monthKey}`);
  const eventRef = monthRef.collection("events").doc(options.jobId);

  await Promise.all([
    monthRef.set({
      estimatedSpendUsd: FieldValue.increment(delta),
      actualizedCalls: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-budget-guard"
    }, { merge: true }),
    eventRef.set({
      actualCostUsd: roundedUsd(options.actualCostUsd),
      inputTokens: options.inputTokens ?? null,
      outputTokens: options.outputTokens ?? null,
      actualizedAt: Timestamp.now(),
      status: "actualized",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "ai-budget-guard"
    }, { merge: true })
  ]);
}
