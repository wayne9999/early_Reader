import { useState } from "react";
import { startSubscriptionCheckout } from "../../services/billingRepository";
import type { SubscriptionTierId } from "../../types";

type UpgradeCheckoutButtonProps = {
  tier: Exclude<SubscriptionTierId, "free">;
  label: string;
};

/**
 * Starts Stripe checkout in the same tab. A same-tab redirect avoids popup
 * blockers (window.open after an await is routinely blocked) and guarantees a
 * full app reload on return, so the trusted subscription state is refetched.
 */
export function UpgradeCheckoutButton({ tier, label }: UpgradeCheckoutButtonProps) {
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  async function startCheckout() {
    setIsStartingCheckout(true);
    setCheckoutError("");

    try {
      window.location.assign(await startSubscriptionCheckout(tier));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not start right now.");
      setIsStartingCheckout(false);
    }
  }

  return (
    <>
      <button
        className="primary-button"
        disabled={isStartingCheckout}
        type="button"
        onClick={() => void startCheckout()}
      >
        {isStartingCheckout ? "Opening checkout..." : label}
      </button>
      {checkoutError ? <p className="form-error">{checkoutError}</p> : null}
    </>
  );
}
