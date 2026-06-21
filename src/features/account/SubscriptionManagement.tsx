import { billingConfig, isCustomerPortalConfigured, isTemporaryStripePortalSession } from "../../services/billingConfig";
import { freeStudentActivitiesDescription, paidStudentActivitiesDescription } from "../../services/entitlementService";
import type { SubscriptionRecord, UserProfile } from "../../types";

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
  const isStudent = profile.role === "student";
  const hasUsablePortalLink = isCustomerPortalConfigured();
  const hasTemporaryPortalSession = isTemporaryStripePortalSession(billingConfig.customerPortalLink);

  if (!isStudent) {
    return null;
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
          <p className="eyebrow">Free access</p>
          <h3>Included</h3>
          <p className="helper-text">{freeStudentActivitiesDescription()}</p>
        </section>
        <section>
          <p className="eyebrow">Paid access</p>
          <h3>Family Plus</h3>
          <p className="helper-text">{paidStudentActivitiesDescription()}</p>
        </section>
      </div>

      <div className="subscription-actions">
        <button
          className="primary-button"
          disabled={!hasUsablePortalLink}
          type="button"
          onClick={() => {
            if (hasUsablePortalLink) {
              window.open(billingConfig.customerPortalLink, "_blank", "noopener,noreferrer");
            }
          }}
        >
          Manage or cancel subscription
        </button>
      </div>

      <p className="helper-text">
        Stripe Customer Portal lets families update cards, view invoices, and cancel monthly billing.{" "}
        {hasTemporaryPortalSession
          ? "The configured portal link looks temporary, so use a durable portal login link or backend-generated session before enabling this button."
          : "If this button is disabled, the portal link still needs to be configured."}
      </p>
    </article>
  );
}
