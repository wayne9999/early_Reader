import type { AppView, SubscriptionTierId } from "../../types";

type HomePageProps = {
  onNavigate: (view: AppView) => void;
  onSelectPlan?: (tier: SubscriptionTierId) => void;
};

const birdBookImageSrc = `${import.meta.env.BASE_URL}brand/readnest-bird-book-768.jpg`;

const parentBenefits = [
  {
    icon: "1",
    title: "Know the next best step",
    text: "Short practice turns into clear guidance, so parents are not left guessing after a hard word or missed sound."
  },
  {
    icon: "2",
    title: "Build brave, happy readers",
    text: "Every activity is designed to feel encouraging, quick, and safe for kids who are still finding confidence."
  },
  {
    icon: "3",
    title: "Keep teachers in the loop",
    text: "Assigned teachers can review patterns, progress, and report-ready notes without overwhelming families."
  }
];

const skillCards = [
  { icon: "ABC", title: "Sight words", text: "Recognize the words children meet most often." },
  { icon: "m-a-p", title: "Phonics", text: "Blend letters into sounds and sounds into words." },
  { icon: "?", title: "Memory", text: "Strengthen focus, recall, and school-ready ideas." },
  { icon: "cat", title: "Rhymes", text: "Hear word families that unlock reading fluency." },
  { icon: "ear", title: "Sounds", text: "Match letters to the sounds they make." },
  { icon: "read", title: "Read aloud", text: "Listen, speak, and grow word-by-word confidence." },
  { icon: "I can", title: "Sentences", text: "Build real sentences with meaning and flow." },
  { icon: "1-2", title: "Story order", text: "Understand what happens first, next, and last." },
  { icon: "idea", title: "Word meaning", text: "Connect words to pictures, actions, and ideas." }
];

const testimonials = [
  {
    quote: "The five-minute practice finally feels doable after school.",
    name: "Parent of a 1st grader"
  },
  {
    quote: "The reports make it easier to see who needs help before frustration builds.",
    name: "Kindergarten teacher"
  },
  {
    quote: "My child asks for the word games because it feels like play.",
    name: "Parent of a kindergartner"
  }
];

const planHighlights = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    text: "Start with core practice and see if ReadNest fits your child.",
    perks: ["Reading and memory", "Rhymes, sounds, sentences", "Basic progress signals"],
    action: "Start free",
    view: "reading" as AppView
  },
  {
    name: "Family Plus",
    price: "$7",
    cadence: "/month",
    text: "Unlock the personalized path that keeps practice moving.",
    perks: ["All student activities", "Personalized practice", "Printable home plans", "Progress history"],
    action: "Start Family Plus",
    view: "account" as AppView,
    featured: true
  },
  {
    name: "Teacher Pro",
    price: "$19",
    cadence: "/month",
    text: "Give teachers a calmer way to guide assigned readers.",
    perks: ["Classroom dashboard", "Student insights", "Report exports", "Invite and assign students"],
    action: "Start Teacher Pro",
    view: "account" as AppView
  }
];

export function HomePage({ onNavigate, onSelectPlan }: HomePageProps) {
  return (
    <div className="home-page">
      <section className="home-hero home-hero-marketing" aria-labelledby="home-title">
        <div className="home-hero-content">
          <p className="home-love-pill">Loved by families and teachers</p>
          <h2 id="home-title">
            Where little readers <span>fall in love</span> with words.
          </h2>
          <p>
            ReadNest turns early reading practice into a joyful daily adventure for kindergarten through grade 2, while
            parents and teachers see the progress that matters.
          </p>
          <div className="home-hero-actions">
            <button className="primary-button child-action-button success-action" type="button" onClick={() => onNavigate("account")}>
              <span className="button-symbol" aria-hidden="true">+</span>
              <span>Start free today</span>
            </button>
            <button className="secondary-button child-action-button next-action" type="button" onClick={() => onNavigate("reading")}>
              <span>See it in action</span>
              <span className="button-symbol" aria-hidden="true">play</span>
            </button>
          </div>
          <p className="home-small-note">Free starter plan. No credit card for guest practice. Caregiver-approved.</p>
        </div>

        <div className="home-story-card" aria-hidden="true">
          <div className="home-story-badge home-story-badge-left">+3 stars earned!</div>
          <div className="home-story-scene">
            <img
              className="home-story-image"
              src={birdBookImageSrc}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width="640"
              height="640"
            />
            <span className="scene-sun">A</span>
            <span className="scene-tree">B</span>
            <span className="scene-owl">go</span>
          </div>
          <div className="home-story-badge home-story-badge-right">6-day streak</div>
        </div>
      </section>

      <section className="home-value-band home-value-band-wide" aria-label="ReadNest value">
        <article>
          <strong>9</strong>
          <span>skill-building games</span>
        </article>
        <article>
          <strong>K-2</strong>
          <span>grades supported</span>
        </article>
        <article>
          <strong>5 min</strong>
          <span>a day to build a habit</span>
        </article>
        <article>
          <strong>Private</strong>
          <span>child-focused progress</span>
        </article>
      </section>

      <section className="home-section home-skill-section" aria-labelledby="skills-title">
        <div className="home-section-heading home-centered-heading">
          <p className="eyebrow">Skills that feel like play</p>
          <h2 id="skills-title">Nine ways to grow a reader.</h2>
          <p>
            Every activity targets an early-literacy skill, then uses practice history to help your child move forward
            with less pressure and more confidence.
          </p>
        </div>
        <div className="home-skill-grid">
          {skillCards.map((card) => (
            <article className="home-skill-card" key={card.title}>
              <span aria-hidden="true">{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <button className="home-text-link" type="button" onClick={() => onNavigate("reading")}>
          Explore free activities
        </button>
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
              <span aria-hidden="true">{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-activity-showcase" aria-labelledby="play-title">
        <div>
          <p className="eyebrow">A calm practice loop</p>
          <h2 id="play-title">Kids play. ReadNest remembers. Adults see what matters.</h2>
          <p>
            Children tap, listen, match, speak, sequence, and choose. The app turns those moments into progress patterns
            for parent summaries, teacher dashboards, and future AI-supported recommendations.
          </p>
          <div className="home-mini-actions">
            <button type="button" onClick={() => onNavigate("memory")}>Try memory</button>
            <button type="button" onClick={() => onNavigate("support")}>Compare plans</button>
          </div>
        </div>
        <div className="home-game-preview" aria-hidden="true">
          <span>A</span>
          <span>sun</span>
          <span>yes</span>
          <span>m</span>
          <span>a</span>
          <span>p</span>
        </div>
      </section>

      <section className="home-section home-testimonial-section" aria-labelledby="trust-title">
        <div className="home-section-heading home-centered-heading">
          <p className="eyebrow">Made for real homes and classrooms</p>
          <h2 id="trust-title">Small wins that parents can feel.</h2>
        </div>
        <div className="home-testimonial-grid">
          {testimonials.map((item) => (
            <article className="home-testimonial-card" key={item.name}>
              <p>"{item.quote}"</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-plan-section" aria-labelledby="plans-title">
        <div className="home-section-heading home-centered-heading">
          <p className="eyebrow">Simple plans for every nest</p>
          <h2 id="plans-title">Start free and upgrade only when you are ready.</h2>
          <p>Family Plus gives children more practice depth. Teacher Pro gives classrooms richer insight.</p>
        </div>
        <div className="home-plan-grid">
          {planHighlights.map((plan) => (
            <article className={plan.featured ? "home-plan-card featured" : "home-plan-card"} key={plan.name}>
              {plan.featured ? <span className="home-plan-badge">Most popular</span> : null}
              <p className="eyebrow">{plan.name}</p>
              <strong>
                {plan.price} <small>{plan.cadence}</small>
              </strong>
              <p>{plan.text}</p>
              <ul>
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button
                className={plan.featured ? "primary-button" : "secondary-button"}
                type="button"
                onClick={() => {
                  if (plan.name === "Family Plus") {
                    onSelectPlan?.("familyPlus");
                    return;
                  }

                  if (plan.name === "Teacher Pro") {
                    onSelectPlan?.("teacherPro");
                    return;
                  }

                  onNavigate(plan.view);
                }}
              >
                {plan.action}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="home-cta-title">
        <h2 id="home-cta-title">Give your child the joy of reading.</h2>
        <p>Start with a few happy minutes today, then let each small win become the reason they come back tomorrow.</p>
        <div className="home-hero-actions">
          <button className="primary-button" type="button" onClick={() => onNavigate("account")}>Create account</button>
          <button className="secondary-button" type="button" onClick={() => onNavigate("support")}>View plans</button>
        </div>
      </section>
    </div>
  );
}
