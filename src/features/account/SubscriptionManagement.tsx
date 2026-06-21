import { billingConfig, isCustomerPortalConfigured, isTemporaryStripePortalSession } from "../../services/billingConfig";
import { freeStudentActivitiesDescription, paidStudentActivitiesDescription } from "../../services/entitlementService";
import type { UserProfile } from "../../types";

type SubscriptionManagementProps = {
  profile: UserProfile;
};

function subscriptionLabel(profile: UserProfile) {
  if (profile.subscriptionTier === "familyPlus" && profile.subscriptionStatus === "active") {
    return "Family Plus active";
  }

  if (profile.subscriptionStatus === "checkoutStarted") {
    return "Checkout started";
  }

  return "Free plan";
}

export function SubscriptionManagement({ profile }: SubscriptionManagementProps) {
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
          Current access: <strong>{subscriptionLabel(profile)}</strong>
        </p>
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
