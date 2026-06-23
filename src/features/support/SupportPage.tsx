import { useEffect, useState, type FormEvent } from "react";
import { billingConfig, linkForTier, subscriptionTiers } from "../../services/billingConfig";
import { createSupportCase } from "../../services/supportCaseRepository";
import { supportMailtoHref } from "../../services/supportConfig";
import type { AppUser, SupportCaseType } from "../../types";

function openPaymentLink(url: string) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

type SupportPageProps = {
  initialFocus?: "donation" | "plans";
  user?: AppUser | null;
};

export function SupportPage({ initialFocus = "plans", user = null }: SupportPageProps) {
  if (initialFocus === "donation") {
    return <DonationPage />;
  }

  return <SupportCenterPage user={user} />;
}

const donationImpact = [
  {
    amount: "$5",
    title: "Keep practice online",
    text: "Helps cover reliable hosting so families can open ReadNest whenever practice time appears."
  },
  {
    amount: "$15",
    title: "Grow the lesson shelf",
    text: "Supports new sight-word sets, sentence practice, memory themes, and read-aloud content."
  },
  {
    amount: "$30",
    title: "Help classrooms",
    text: "Funds teacher tools, accessibility testing, progress views, and kid-friendly improvements."
  }
];

const supportTopics = [
  {
    title: "Account and sign-in help",
    text: "Get help with parent, student, teacher, or guest access and choosing the right role."
  },
  {
    title: "Student progress",
    text: "Understand reading history, memory practice, daily goals, strengths, and areas needing review."
  },
  {
    title: "Teacher setup",
    text: "Connect students, review assigned learners, and use dashboard insights for small-group teaching."
  },
  {
    title: "Billing and packages",
    text: "Review family and teacher plans, donation checkout, and what is included before upgrading."
  },
  {
    title: "Cancel or update billing",
    text: "Use Account > Manage monthly billing to open Stripe Customer Portal, update cards, view invoices, or cancel monthly billing."
  },
  {
    title: "Parent data deletion",
    text: "Parents can request deletion of account, child profile, assignment, or learning history data through support."
  },
  {
    title: "Teacher verification help",
    text: "Teachers can prepare state/license information for admin review before being marked verified."
  }
];

const quickFixes = [
  "Confirm whether you are signed in as a guest, student, teacher, or admin.",
  "Open Account if the wrong role appears, then finish the parent or teacher setup flow.",
  "For missing student history, have the student sign in and request the teacher again from Find Teacher.",
  "For failed payment or cancellation questions, open Account and choose Manage monthly billing.",
  "For data deletion, email support from the parent account email and include the request type."
];

const faqs = [
  {
    question: "Can a child use ReadNest without an account?",
    answer: "Yes. Guest practice works locally, while a student account saves history for long-term progress."
  },
  {
    question: "Can teachers see every student?",
    answer: "No. Teachers only see students assigned to them, and students only see their own learning data."
  },
  {
    question: "Where do donations and subscriptions happen?",
    answer: "Checkout opens on Stripe-hosted pages so payment details stay with Stripe instead of this app."
  },
  {
    question: "How do I cancel a monthly subscription?",
    answer: "Open Account, choose Manage monthly billing, and cancel through Stripe Customer Portal. Free activities remain available."
  },
  {
    question: "Is ReadNest a diagnosis tool?",
    answer: "No. ReadNest is educational practice support, not a medical, clinical, or diagnostic service."
  }
];

function DonationPage() {
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Donate to ReadNest</p>
          <h2>Help children keep reading practice within reach</h2>
        </div>
      </div>

      <section className="donation-hero practice-panel">
        <div className="donation-hero-copy">
          <p className="eyebrow">Mission fund</p>
          <h3>Every gift helps a young reader get one more calm, playful practice moment.</h3>
          <p className="helper-text">
            Donations help keep ReadNest accessible while funding lessons, accessibility improvements,
            teacher tools, hosting, and friendly reading experiences for early elementary learners.
          </p>
          <div className="donation-actions">
            <button
              className="donation-button"
              disabled={!billingConfig.donationLink}
              type="button"
              onClick={() => openPaymentLink(billingConfig.donationLink)}
            >
              Donate now
            </button>
            <span>Secure checkout opens with Stripe.</span>
          </div>
        </div>

        <div className="donation-visual" aria-hidden="true">
          <span>Read</span>
          <span>Play</span>
          <span>Grow</span>
        </div>
      </section>

      <section className="donation-impact-grid" aria-label="Donation impact examples">
        {donationImpact.map((impact) => (
          <article className="donation-impact-card" key={impact.amount}>
            <strong>{impact.amount}</strong>
            <h3>{impact.title}</h3>
            <p>{impact.text}</p>
          </article>
        ))}
      </section>

      <section className="donation-use-panel practice-panel">
        <div>
          <p className="eyebrow">Where gifts go</p>
          <h3>Built around kids, caregivers, and classrooms.</h3>
          <p className="helper-text">
            The goal is simple: make short reading practice feel inviting, track progress clearly, and help
            adults know where a child needs support next.
          </p>
        </div>
        <ul className="donation-use-list">
          <li>Free reading, sound, sentence, and memory activities.</li>
          <li>Accessible color, voice, and layout improvements for young learners.</li>
          <li>Teacher dashboard tools for strengths, growth areas, and next-step planning.</li>
          <li>Cloud services that keep learning history available across devices.</li>
        </ul>
      </section>
    </>
  );
}

function SupportCenterPage({ user }: { user: AppUser | null }) {
  const paidTiers = subscriptionTiers.filter((tier) => tier.id !== "free");
  const [caseType, setCaseType] = useState<SupportCaseType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [caseStatus, setCaseStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [contactEmail, user?.email]);

  async function submitSupportCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaseStatus("");

    if (!user) {
      setCaseStatus("Sign in first so ReadNest can attach the request to the right account.");
      return;
    }

    setIsSending(true);

    try {
      await createSupportCase(user, {
        type: caseType,
        subject,
        message,
        contactEmail: contactEmail || user.email || null
      });
      setSubject("");
      setMessage("");
      setCaseStatus("Support request saved. ReadNest will create an internal summary and email the support team when backend email is configured.");
    } catch (error) {
      setCaseStatus(error instanceof Error ? error.message : "Could not save the support request.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">ReadNest support</p>
          <h2>Support center for families and teachers</h2>
        </div>
      </div>

      <section className="support-center-hero practice-panel">
        <div>
          <p className="eyebrow">How can we help?</p>
          <h3>Get help with accounts, learners, progress, and packages.</h3>
          <p className="helper-text">
            Start here when something feels unclear. ReadNest separates guest, student, teacher, and admin
            experiences so each person sees the right tools and the right learning data.
          </p>
        </div>
        <a className="support-action" href={supportMailtoHref()}>
          Email support
        </a>
      </section>

      <section className="support-topic-grid" aria-label="Support topics">
        {supportTopics.map((topic) => (
          <article className="support-topic-card" key={topic.title}>
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
          </article>
        ))}
      </section>

      <section className="support-help-grid">
        <article className="practice-panel support-request-panel">
          <p className="eyebrow">Contact us</p>
          <h3>Send a message to ReadNest support</h3>
          <p className="helper-text">
            Signed-in families and teachers can send billing, deletion, teacher verification, or technical messages.
            ReadNest stores the request in Firebase and alerts the support team when backend email is configured.
          </p>
          <form className="support-case-form" onSubmit={(event) => void submitSupportCase(event)}>
            <label>
              <span>Request type</span>
              <select value={caseType} onChange={(event) => setCaseType(event.target.value as SupportCaseType)}>
                <option value="general">General help</option>
                <option value="billing">Billing or cancellation</option>
                <option value="dataDeletion">Parent data deletion</option>
                <option value="teacherVerification">Teacher verification</option>
                <option value="technical">Technical issue</option>
              </select>
            </label>
            <label>
              <span>Subject</span>
              <input
                maxLength={120}
                placeholder="Example: Delete child practice history"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </label>
            <label>
              <span>Contact email</span>
              <input
                autoComplete="email"
                maxLength={160}
                placeholder="name@example.com"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Message</span>
              <textarea
                maxLength={1200}
                placeholder="Share the account, request type, and what you need help with. Do not include payment card details."
                required
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <button className="primary-button" disabled={isSending || !user} type="submit">
              {user ? isSending ? "Sending..." : "Send support request" : "Sign in to send"}
            </button>
          </form>
          {caseStatus ? <p className="helper-text" role="status">{caseStatus}</p> : null}
          {!user ? (
            <p className="helper-text">
              Guests can still email support, but data deletion and billing requests need a signed-in account for verification.
            </p>
          ) : null}
        </article>

        <article className="practice-panel support-steps-panel">
          <p className="eyebrow">Common fixes</p>
          <h3>Before sending a request</h3>
          <ol>
            {quickFixes.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="practice-panel support-faq-panel">
          <p className="eyebrow">Quick answers</p>
          <h3>Frequently asked</h3>
          <div className="faq-list">
            {faqs.map((faq) => (
              <section key={faq.question}>
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="package-panel practice-panel" aria-label="Package deals">
        <div className="package-panel-heading">
          <div>
            <p className="eyebrow">Package deals</p>
            <h3>Upgrade when you need more support</h3>
          </div>
          <p className="helper-text">
            Free practice stays available. Paid plans add more family and classroom tools when a learner needs
            deeper history, planning, and reporting.
          </p>
        </div>

        <div className="package-grid">
          {paidTiers.map((tier) => {
            const paymentLink = linkForTier(tier);

            return (
              <article className={`package-card ${tier.id}`} key={tier.id}>
                <p className="eyebrow">{tier.audience}</p>
                <h3>{tier.name}</h3>
                <strong>{tier.price}</strong>
                <p>{tier.description}</p>
                <ul>
                  {tier.perks.slice(0, 3).map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <button
                  className="primary-button"
                  disabled={!paymentLink}
                  type="button"
                  onClick={() => openPaymentLink(paymentLink)}
                >
                  {tier.cta}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
