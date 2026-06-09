import { billingConfig, isBillingConfigured, linkForTier, subscriptionTiers } from "../../services/billingConfig";

function openPaymentLink(url: string) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

type SupportPageProps = {
  initialFocus?: "donation" | "plans";
};

export function SupportPage({ initialFocus = "plans" }: SupportPageProps) {
  const heading =
    initialFocus === "donation"
      ? "Give the gift of early reading"
      : "Help keep early reading practice accessible";

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Support ReadNest</p>
          <h2>{heading}</h2>
        </div>
      </div>

      <section className="support-hero practice-panel">
        <div>
          <p className="eyebrow">Donate to the mission</p>
          <h3>Help more children build reading confidence</h3>
          <p className="helper-text">
            Every donation helps fund free lessons, hosting, accessibility testing, classroom tools,
            teacher resources, and expanded literacy content for young learners.
          </p>
          <div className="impact-row" aria-label="Donation impact examples">
            <span>$5 helps hosting</span>
            <span>$10 supports new words</span>
            <span>$25 helps classroom tools</span>
          </div>
        </div>
        <button
          className="donation-button"
          disabled={!billingConfig.donationLink}
          type="button"
          onClick={() => openPaymentLink(billingConfig.donationLink)}
        >
          Donate now
        </button>
      </section>

      <section className="pricing-grid" aria-label="Subscription plans">
        {subscriptionTiers.map((tier) => {
          const paymentLink = linkForTier(tier);
          const isPaid = Boolean(tier.paymentEnvKey);

          return (
            <article className={`pricing-card ${tier.id}`} key={tier.id}>
              <p className="eyebrow">{tier.audience}</p>
              <h3>{tier.name}</h3>
              <strong>{tier.price}</strong>
              <p>{tier.description}</p>
              <ul>
                {tier.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button
                className={isPaid ? "primary-button" : "secondary-button"}
                disabled={isPaid && !paymentLink}
                type="button"
                onClick={() => openPaymentLink(paymentLink)}
              >
                {tier.cta}
              </button>
            </article>
          );
        })}
      </section>

      <article className="practice-panel setup-panel">
        <p className="eyebrow">Billing setup</p>
        <h3>{isBillingConfigured() ? "Stripe links are configured" : "Stripe links need to be added"}</h3>
        <p className="helper-text">
          This app uses Stripe Payment Links so donations and subscriptions happen on Stripe-hosted checkout
          pages. Add the links in `.env.local` for production.
        </p>
        <ul className="next-steps">
          <li>`VITE_STRIPE_DONATION_LINK` for one-time or pay-what-you-want donations.</li>
          <li>`VITE_STRIPE_FAMILY_PLUS_LINK` for the Family Plus monthly plan.</li>
          <li>`VITE_STRIPE_TEACHER_PRO_LINK` for the Teacher Pro monthly plan.</li>
        </ul>
      </article>
    </>
  );
}
