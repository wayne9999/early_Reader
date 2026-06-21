import { describe, expect, it } from "vitest";
import { isTemporaryStripePortalSession } from "./billingConfig";

describe("billingConfig", () => {
  it("detects short-lived Stripe Customer Portal session links", () => {
    expect(isTemporaryStripePortalSession("https://billing.stripe.com/p/session/test_123")).toBe(true);
    expect(isTemporaryStripePortalSession("https://billing.stripe.com/p/login/test_123")).toBe(false);
    expect(isTemporaryStripePortalSession("https://example.com/billing/customer-portal")).toBe(false);
  });
});
