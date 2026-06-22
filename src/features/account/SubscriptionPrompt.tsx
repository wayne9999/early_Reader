import { useMemo, useState } from "react";
import { subscriptionTiers } from "../../services/billingConfig";
import { startSubscriptionCheckout } from "../../services/billingRepository";
import {
  freeStudentActivitiesDescription,
  paidStudentActivitiesDescription
} from "../../services/entitlementService";
import { updateUserProfile } from "../../services/userProfileRepository";
import { trackProductEvent } from "../../services/productAnalytics";
import type { AppUser, SubscriptionTierId, UserProfile } from "../../types";

type SubscriptionPromptProps = {
  user: AppUser;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onContinue: () => void;
};

export function SubscriptionPrompt({ user, profile, onProfileUpdated, onContinue }: SubscriptionPromptProps) {
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const paidTierId: SubscriptionTierId = profile.role === "teacher" ? "teacherPro" : "familyPlus";
  const paidTier = useMemo(
    () => subscriptionTiers.find((tier) => tier.id === paidTierId),
    [paidTierId]
  );
  const isTeacher = profile.role === "teacher";
  const freeTitle = isTeacher ? "Free teacher account" : "Free student";
  const paidTitle = paidTier?.name ?? (isTeacher ? "Teacher Pro" : "Family Plus");
  const promptEyebrow = isTeacher ? "Teacher Pro" : "Family Plus";
  const promptTitle = isTeacher ? "Unlock the full teaching workspace" : "Unlock the full student learning path";
  const promptHelp = isTeacher
    ? "Free teacher accounts can review the app and create a profile. Teacher Pro unlocks assigned-student data, reports, intervention planning, and AI-ready insight workflows."
    : `Free student accounts can keep practicing with ${freeStudentActivitiesDescription()}. Family Plus unlocks more guided activities and premium learning support as the product grows.`;

  async function startPaidPlan() {
    setIsStartingCheckout(true);
    setCheckoutError("");

    const nextProfile = await updateUserProfile(user, profile, {
      subscriptionTier: paidTierId,
      subscriptionStatus: "checkoutStarted"
    });

    onProfileUpdated(nextProfile);
    void trackProductEvent(user, "checkout_clicked", { tier: paidTierId });

    try {
      const checkoutUrl = await startSubscriptionCheckout(paidTierId);

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      } else {
        setCheckoutError("Checkout is not configured yet. Visit Support for billing help.");
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not start right now.");
    } finally {
      setIsStartingCheckout(false);
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
      <p className="eyebrow">{promptEyebrow}</p>
      <h2>{promptTitle}</h2>
      <p className="helper-text">{promptHelp}</p>

      <div className="subscription-compare-grid">
        <section>
          <p className="eyebrow">{freeTitle}</p>
          <h3>{isTeacher ? "Create your profile" : "Start practicing"}</h3>
          <ul className="next-steps">
            {isTeacher ? (
              <>
                <li>Complete your teacher profile and verification details</li>
                <li>Preview child-friendly activities and family support pages</li>
                <li>Upgrade before using classroom dashboards and reports</li>
              </>
            ) : (
              <>
                <li>{freeStudentActivitiesDescription()}</li>
                <li>Basic progress saved to the student account</li>
                <li>Teacher request workflow and holding-space assignment</li>
              </>
            )}
          </ul>
        </section>
        <section>
          <p className="eyebrow">{paidTitle}</p>
          <h3>{isTeacher ? "Classroom tools unlocked" : "More practice unlocked"}</h3>
          <ul className="next-steps">
            {(paidTier?.perks ?? [paidStudentActivitiesDescription()]).slice(0, 4).map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
            <li>Stripe-hosted checkout so payment data stays with Stripe</li>
          </ul>
        </section>
      </div>

      <div className="subscription-actions">
        <button
          className="primary-button"
          disabled={isStartingCheckout}
          type="button"
          onClick={() => void startPaidPlan()}
        >
          {isStartingCheckout ? "Opening checkout..." : paidTier?.cta ?? `Start ${paidTitle}`}
        </button>
        <button className="secondary-button" type="button" onClick={() => void skipForNow()}>
          Skip for now
        </button>
      </div>

      {checkoutError ? <p className="form-error">{checkoutError}</p> : null}

      <p className="helper-text">
        Paid access unlocks only after Stripe confirms checkout and Firebase receives the trusted subscription update.
      </p>
    </article>
  );
}
