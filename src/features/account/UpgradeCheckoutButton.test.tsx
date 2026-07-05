import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpgradeCheckoutButton } from "./UpgradeCheckoutButton";
import { startSubscriptionCheckout } from "../../services/billingRepository";

vi.mock("../../services/billingRepository", () => ({
  startSubscriptionCheckout: vi.fn()
}));

describe("UpgradeCheckoutButton", () => {
  beforeEach(() => {
    vi.mocked(startSubscriptionCheckout).mockReset();
  });

  it("redirects the current tab to Stripe checkout so popup blockers cannot break upgrades", async () => {
    const userEventApi = userEvent.setup();
    const assignSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign: assignSpy });
    vi.mocked(startSubscriptionCheckout).mockResolvedValue("https://checkout.stripe.com/pay/cs_test_123");

    render(<UpgradeCheckoutButton tier="familyPlus" label="Start Family Plus" />);
    await userEventApi.click(screen.getByRole("button", { name: "Start Family Plus" }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith("https://checkout.stripe.com/pay/cs_test_123");
    });
    expect(startSubscriptionCheckout).toHaveBeenCalledWith("familyPlus");
    vi.unstubAllGlobals();
  });

  it("shows the checkout error instead of failing silently", async () => {
    const userEventApi = userEvent.setup();
    vi.mocked(startSubscriptionCheckout).mockRejectedValue(new Error("Sign in before starting a subscription."));

    render(<UpgradeCheckoutButton tier="teacherPro" label="Start Teacher Pro" />);
    await userEventApi.click(screen.getByRole("button", { name: "Start Teacher Pro" }));

    expect(await screen.findByText("Sign in before starting a subscription.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Teacher Pro" })).toBeEnabled();
  });
});
