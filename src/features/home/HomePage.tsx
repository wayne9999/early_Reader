import type { AppView } from "../../types";

type HomePageProps = {
  onNavigate: (view: AppView) => void;
};

const parentBenefits = [
  {
    title: "Know what to practice next",
    text: "ReadNest turns short activities into simple next steps, so five calm minutes can still feel purposeful."
  },
  {
    title: "See confidence grow",
    text: "Progress summaries show known words, recent practice, strengths, and areas that need a little more support."
  },
  {
    title: "Bring teachers into the loop",
    text: "Teacher dashboards help assigned educators review patterns, reports, and next moves without overwhelming families."
  }
];

const planHighlights = [
  {
    name: "Free starter",
    price: "$0",
    text: "Try reading, memory, rhymes, sounds, and sentences before choosing a paid path.",
    action: "Try reading",
    view: "reading" as AppView
  },
  {
    name: "Family Plus",
    price: "Monthly",
    text: "Unlock personalized practice paths, premium activities, progress history, and printable practice support.",
    action: "Start family plan",
    view: "account" as AppView
  },
  {
    name: "Teacher Pro",
    price: "Monthly",
    text: "Review assigned students, learning history, reports, intervention ideas, and future AI-supported recommendations.",
    action: "Teacher setup",
    view: "account" as AppView
  }
];

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content">
          <p className="eyebrow">Personalized reading help for K-2</p>
          <h2 id="home-title">Help your child feel brave around words.</h2>
          <p>
            ReadNest blends playful reading games, parent progress signals, and teacher insight so early readers get
            practice that feels small, joyful, and worth coming back to.
          </p>
          <div className="home-hero-actions">
            <button className="primary-button child-action-button success-action" type="button" onClick={() => onNavigate("account")}>
              <span className="button-symbol" aria-hidden="true">✓</span>
              <span>Create account</span>
            </button>
            <button className="secondary-button child-action-button next-action" type="button" onClick={() => onNavigate("reading")}>
              <span>Try free activity</span>
              <span className="button-symbol" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <div className="home-learning-stage" aria-hidden="true">
          <div className="stage-orbit">
            <span>sun</span>
            <span>cat</span>
            <span>map</span>
            <span>go</span>
          </div>
          <div className="stage-reader">
            <span>R</span>
            <strong>read</strong>
            <small>listen</small>
          </div>
          <div className="stage-progress">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="home-value-band" aria-label="ReadNest value">
        <article>
          <strong>5-10</strong>
          <span>minute practice sessions</span>
        </article>
        <article>
          <strong>K-2</strong>
          <span>age-aware reading content</span>
        </article>
        <article>
          <strong>2 free</strong>
          <span>guest activities to start</span>
        </article>
      </section>

      <section className="home-section home-for-parents" aria-labelledby="parents-title">
        <div className="home-section-heading">
          <p className="eyebrow">Built for the parent who wants to help</p>
          <h2 id="parents-title">No guessing. No pressure. Just a clearer path.</h2>
          <p>
            Early reading can feel emotional because parents see the effort behind every word. ReadNest keeps practice
            short, encouraging, and specific, so families can celebrate progress and know what still needs attention.
          </p>
        </div>
        <div className="home-benefit-grid">
          {parentBenefits.map((benefit) => (
            <article className="home-benefit-card" key={benefit.title}>
              <span aria-hidden="true">✓</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-activity-showcase" aria-labelledby="play-title">
        <div>
          <p className="eyebrow">Play that still teaches</p>
          <h2 id="play-title">Activities feel like games, but the data points to growth.</h2>
          <p>
            Kids tap, listen, match, speak, sequence, and choose. Parents and teachers see patterns over time, not just
            a score from one sitting.
          </p>
          <div className="home-mini-actions">
            <button type="button" onClick={() => onNavigate("memory")}>Memory game</button>
            <button type="button" onClick={() => onNavigate("support")}>See plans</button>
          </div>
        </div>
        <div className="home-game-preview" aria-hidden="true">
          <span>A</span>
          <span>sun</span>
          <span>✓</span>
          <span>m</span>
          <span>a</span>
          <span>p</span>
        </div>
      </section>

      <section className="home-section home-plan-section" aria-labelledby="plans-title">
        <div className="home-section-heading">
          <p className="eyebrow">Free start, paid growth paths</p>
          <h2 id="plans-title">Choose the support level that fits your reader.</h2>
        </div>
        <div className="home-plan-grid">
          {planHighlights.map((plan) => (
            <article className="home-plan-card" key={plan.name}>
              <p className="eyebrow">{plan.name}</p>
              <strong>{plan.price}</strong>
              <p>{plan.text}</p>
              <button
                className={plan.name === "Free starter" ? "secondary-button" : "primary-button"}
                type="button"
                onClick={() => onNavigate(plan.view)}
              >
                {plan.action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
