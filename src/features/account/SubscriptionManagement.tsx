import { useMemo, useState } from "react";
import { createBillingPortalUrl, startSubscriptionCheckout } from "../../services/billingRepository";
import { freeStudentActivitiesDescription, paidStudentActivitiesDescription } from "../../services/entitlementService";
import type { SubscriptionRecord, SubscriptionTierId, UserProfile } from "../../types";

type SubscriptionManagementProps = {
  profile: UserProfile;
  subscription: SubscriptionRecord | null;
};

function subscriptionLabel(profile: UserProfile, subscription: SubscriptionRecord | null) {
  const tier = subscription?.tier ?? profile.subscriptionTier;
  const status = subscription?.status ?? profile.subscriptionStatus;

  if (tier === "familyPlus" && status === "active") {
    return "Family Plus active";
  }

  if (tier === "teacherPro" && status === "active") {
    return "Teacher Pro active";
  }

  if (status === "pastDue") {
    return "Payment needs attention";
  }

  if (status === "canceled") {
    return "Subscription canceled";
  }

  if (status === "checkoutStarted") {
    return "Checkout started";
  }

  return "Free plan";
}

function subscriptionHelpText(subscription: SubscriptionRecord | null) {
  if (subscription?.status === "pastDue") {
    return "Your last payment did not complete. Use billing management to update the payment method and restore premium access.";
  }

  if (subscription?.status === "canceled") {
    return "Monthly billing is canceled. Free activities remain available, and premium activities can be reactivated from the support page.";
  }

  if (subscription?.source === "demo") {
    return "Production paid access is confirmed from the secure subscriptions collection after Stripe webhooks run.";
  }

  return "Stripe Customer Portal lets families update cards, view invoices, and cancel monthly billing.";
}

export function SubscriptionManagement({ profile, subscription }: SubscriptionManagementProps) {
  const [checkoutError, setCheckoutError] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const rolePlanId: SubscriptionTierId = profile.role === "teacher" ? "teacherPro" : "familyPlus";
  const rolePlanLabel = profile.role === "teacher" ? "Teacher Pro" : "Family Plus";
  const freeLabel = profile.role === "teacher" ? "Free teacher profile" : "Free access";
  const paidDescription = profile.role === "teacher"
    ? "Classroom dashboard, assigned-student analysis, report exports, intervention planning, and AI-supported recommendations when enabled."
    : paidStudentActivitiesDescription();
  const isPaidActive = useMemo(
    () => (subscription?.tier ?? profile.subscriptionTier) === rolePlanId
      && (subscription?.status ?? profile.subscriptionStatus) === "active",
    [profile.subscriptionStatus, profile.subscriptionTier, rolePlanId, subscription]
  );
  async function startRoleCheckout() {
    setIsStartingCheckout(true);
    setCheckoutError("");

    try {
      const checkoutUrl = await startSubscriptionCheckout(rolePlanId);

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        setCheckoutError("Checkout is not configured yet. Contact support for billing help.");
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not start right now.");
    } finally {
      setIsStartingCheckout(false);
    }
  }

  async function openBillingPortal() {
    setIsOpeningPortal(true);
    setCheckoutError("");

    try {
      window.location.assign(await createBillingPortalUrl());
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Billing management could not open right now.");
    } finally {
      setIsOpeningPortal(false);
    }
  }

  return (
    <article className="practice-panel subscription-management">
      <div>
        <p className="eyebrow">Subscription</p>
        <h2>Manage monthly billing</h2>
        <p className="helper-text">
          Current access: <strong>{subscriptionLabel(profile, subscription)}</strong>
        </p>
        <p className="helper-text">{subscriptionHelpText(subscription)}</p>
      </div>

      <div className="subscription-compare-grid">
        <section>
          <p className="eyebrow">{freeLabel}</p>
          <h3>Included</h3>
          <p className="helper-text">
            {profile.role === "teacher"
              ? "Create a teacher profile, review public pages, and preview activities before subscribing."
              : `${freeStudentActivitiesDescription()} with basic personalized progress signals.`}
          </p>
        </section>
        <section>
          <p className="eyebrow">Paid access</p>
          <h3>{rolePlanLabel}</h3>
          <p className="helper-text">{paidDescription}</p>
        </section>
      </div>

      <div className="subscription-actions">
        {!isPaidActive ? (
          <button
            className="primary-button"
            disabled={isStartingCheckout}
            type="button"
            onClick={() => void startRoleCheckout()}
          >
            {isStartingCheckout ? "Opening checkout..." : `Start ${rolePlanLabel}`}
          </button>
        ) : null}
        <button
          className={isPaidActive ? "primary-button" : "secondary-button"}
          disabled={!isPaidActive || isOpeningPortal}
          type="button"
          onClick={() => void openBillingPortal()}
        >
          {isOpeningPortal ? "Opening billing..." : "Manage or cancel subscription"}
        </button>
      </div>

      {checkoutError ? <p className="form-error">{checkoutError}</p> : null}

      <p className="helper-text">
        Stripe Customer Portal lets active subscribers update cards, view invoices, and cancel monthly billing.
      </p>
    </article>
  );
}
