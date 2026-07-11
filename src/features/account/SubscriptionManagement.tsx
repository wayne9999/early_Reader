import { useMemo, useState } from "react";
import { createBillingPortalUrl, startSubscriptionCheckout } from "../../services/billingRepository";
import { freeStudentActivitiesDescription, paidStudentActivitiesDescription } from "../../services/entitlementService";
import type { SubscriptionRecord, SubscriptionTierId, UserProfile } from "../../types";

type SubscriptionManagementProps = {
  profile: UserProfile;
  subscription: SubscriptionRecord | null;
  onRefresh?: () => Promise<SubscriptionRecord | null>;
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

export function SubscriptionManagement({ profile, subscription, onRefresh }: SubscriptionManagementProps) {
  const [checkoutError, setCheckoutError] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");
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
      window.location.assign(await startSubscriptionCheckout(rolePlanId));
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not start right now.");
      setIsStartingCheckout(false);
    }
  }

  async function refreshSubscriptionStatus() {
    if (!onRefresh) {
      return;
    }

    setIsRefreshing(true);
    setRefreshStatus("");

    try {
      const refreshed = await onRefresh();

      setRefreshStatus(
        refreshed?.status === "active"
          ? "Paid access is active."
          : "Status refreshed. Stripe confirmation can take a few moments after checkout."
      );
    } catch (error) {
      setRefreshStatus(error instanceof Error ? error.message : "Could not refresh the subscription right now.");
    } finally {
      setIsRefreshing(false);
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
        {onRefresh && !isPaidActive ? (
          <button
            className="secondary-button"
            disabled={isRefreshing}
            type="button"
            onClick={() => void refreshSubscriptionStatus()}
          >
            {isRefreshing ? "Checking..." : "Refresh status"}
          </button>
        ) : null}
      </div>

      {checkoutError ? <p className="form-error">{checkoutError}</p> : null}
      {refreshStatus ? <p className="helper-text">{refreshStatus}</p> : null}

      <p className="helper-text">
        Stripe Customer Portal lets active subscribers update cards, view invoices, and cancel monthly billing.
      </p>
    </article>
  );
}
