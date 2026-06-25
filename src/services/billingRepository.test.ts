import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpsCallable } from "firebase/functions";
import { createBillingPortalUrl, startSubscriptionCheckout } from "./billingRepository";
import { getFirebaseRuntime } from "./firebase";

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn()
}));

vi.mock("./firebase", () => ({
  getFirebaseRuntime: vi.fn()
}));

describe("billingRepository", () => {
  beforeEach(() => {
    vi.mocked(getFirebaseRuntime).mockReturnValue({
      auth: { currentUser: { uid: "user-1" } },
      functions: {}
    } as never);
    vi.mocked(httpsCallable).mockReset();
  });

  it("requires the trusted backend checkout URL", async () => {
    vi.mocked(httpsCallable).mockReturnValue(vi.fn().mockResolvedValue({
      data: { url: "https://checkout.stripe.com/test-session" }
    }) as never);

    await expect(startSubscriptionCheckout("familyPlus")).resolves.toBe(
      "https://checkout.stripe.com/test-session"
    );
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "createCheckoutSession");
  });

  it("does not fall back to a static payment link when checkout fails", async () => {
    vi.mocked(httpsCallable).mockReturnValue(vi.fn().mockRejectedValue(new Error("backend unavailable")) as never);

    await expect(startSubscriptionCheckout("teacherPro")).rejects.toThrow("backend unavailable");
  });

  it("creates a fresh authenticated billing portal session", async () => {
    vi.mocked(httpsCallable).mockReturnValue(vi.fn().mockResolvedValue({
      data: { url: "https://billing.stripe.com/session/test" }
    }) as never);

    await expect(createBillingPortalUrl()).resolves.toBe("https://billing.stripe.com/session/test");
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "createBillingPortalSession");
  });
});
