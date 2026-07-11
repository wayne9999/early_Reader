import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const functionsSource = readFileSync("functions/src/index.ts", "utf8");

describe("Firebase Stripe subscription contract", () => {
  it("reads the billing period end from the Stripe subscription item", () => {
    expect(functionsSource).toContain("firstItem?.current_period_end");
    expect(functionsSource).toContain("firstItem.current_period_end * 1000");
  });

  it("rejects out-of-order Stripe webhook events", () => {
    expect(functionsSource).toContain("lastStripeEventCreated");
    expect(functionsSource).toContain("options.eventCreated < lastStripeEventCreated");
  });

  it("syncs auth claims on every subscription status change, including downgrades", () => {
    expect(functionsSource).toContain("async function syncSubscriptionClaims(");
    const claimSyncCalls = functionsSource.match(/await syncSubscriptionClaims\(/g) ?? [];
    // handleSubscription, handleInvoicePaymentFailed, and handleRefundOrDispute
    // must all refresh claims so refunds and failed payments revoke access.
    expect(claimSyncCalls.length).toBeGreaterThanOrEqual(3);
  });

  it("only cancels paid access for fully refunded charges", () => {
    expect(functionsSource).toContain("charge.refunded === true");
    expect(functionsSource).toContain("stripe_partial_refund_ignored");
  });

  it("never downgrades an active subscription from a non-subscription checkout", () => {
    expect(functionsSource).toContain("skipIfActive: true");
    expect(functionsSource).toContain('existing.status === "active"');
  });

  it("requires recorded consent before scheduled AI insight jobs", () => {
    expect(functionsSource).toContain("profile.parentConsentAccepted === true || profile.aiRecommendationsConsentAccepted === true");
    expect(functionsSource).toContain("ai_daily_jobs_consent_skipped");
  });
});
