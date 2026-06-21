import { billingConfig } from "../../services/billingConfig";
import {
  freeStudentActivitiesDescription,
  paidStudentActivitiesDescription
} from "../../services/entitlementService";
import { updateUserProfile } from "../../services/userProfileRepository";
import { trackProductEvent } from "../../services/productAnalytics";
import type { AppUser, UserProfile } from "../../types";

type SubscriptionPromptProps = {
  user: AppUser;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onContinue: () => void;
};

export function SubscriptionPrompt({ user, profile, onProfileUpdated, onContinue }: SubscriptionPromptProps) {
  async function startFamilyPlus() {
    const nextProfile = await updateUserProfile(user, profile, {
      subscriptionTier: "familyPlus",
      subscriptionStatus: "checkoutStarted"
    });

    onProfileUpdated(nextProfile);
    void trackProductEvent(user, "checkout_clicked", { tier: "familyPlus" });

    if (billingConfig.familyPlusLink) {
      window.open(billingConfig.familyPlusLink, "_blank", "noopener,noreferrer");
    }
  }

  async function skipForNow() {
    onProfileUpdated(
      await updateUserProfile(user, profile, {
        subscriptionTier: "free",
        subscriptionStatus: "free",
        subscriptionPromptSkippedAt: new Date().toISOString()
      })
    );
    onContinue();
  }

  return (
    <article className="practice-panel subscription-prompt">
      <p className="eyebrow">Family Plus</p>
      <h2>Unlock the full student learning path</h2>
      <p className="helper-text">
        Free student accounts can keep practicing with {freeStudentActivitiesDescription()}. Family Plus unlocks
        more guided activities and premium learning support as the product grows.
      </p>

      <div className="subscription-compare-grid">
        <section>
          <p className="eyebrow">Free student</p>
          <h3>Start practicing</h3>
          <ul className="next-steps">
            <li>{freeStudentActivitiesDescription()}</li>
            <li>Basic progress saved to the student account</li>
            <li>Teacher request workflow</li>
          </ul>
        </section>
        <section>
          <p className="eyebrow">Family Plus</p>
          <h3>More practice unlocked</h3>
          <ul className="next-steps">
            <li>{paidStudentActivitiesDescription()}</li>
            <li>More skill practice for comprehension and vocabulary</li>
            <li>Stripe-hosted checkout so payment data stays with Stripe</li>
          </ul>
        </section>
      </div>

      <div className="subscription-actions">
        <button
          className="primary-button"
          disabled={!billingConfig.familyPlusLink}
          type="button"
          onClick={() => void startFamilyPlus()}
        >
          Start Family Plus
        </button>
        <button className="secondary-button" type="button" onClick={() => void skipForNow()}>
          Skip for now
        </button>
      </div>

      <p className="helper-text">
        Production note: paid access should be confirmed by a Stripe webhook that updates Firebase after checkout.
      </p>
    </article>
  );
}
