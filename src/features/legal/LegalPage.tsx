import { supportConfig } from "../../services/supportConfig";
import type { AppView } from "../../types";

type LegalPageProps = {
  page: Extract<AppView, "privacy" | "terms" | "childrenPrivacy" | "parentConsent" | "teacherTerms" | "refundPolicy">;
};

const legalContent: Record<LegalPageProps["page"], { eyebrow: string; title: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    sections: [
      {
        heading: "What ReadNest collects",
        body: "ReadNest stores account details, role, subscription status, learning progress, teacher assignments, and support requests needed to provide the service. The app should avoid collecting unnecessary child personal information."
      },
      {
        heading: "How data is used",
        body: "Learning data is used to show progress, recommend practice, support assigned teachers, and operate billing. Analytics should be event-based and should not include child names, emails, or free-form sensitive notes."
      },
      {
        heading: "Data deletion",
        body: `Parents can request account, child profile, or learning history deletion by contacting ${supportConfig.email}. Production operations should verify the requester before deleting or exporting child data.`
      }
    ]
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms of Use",
    sections: [
      {
        heading: "Educational support",
        body: "ReadNest provides personalized reading practice and progress support. It is not medical advice, a diagnosis, or a replacement for a licensed professional evaluation."
      },
      {
        heading: "Accounts",
        body: "Users must choose the correct account type. Student, parent, teacher, and admin permissions are separated so learning data is only available to authorized users."
      },
      {
        heading: "Safe use",
        body: "Teachers and caregivers should use respectful, age-appropriate guidance and should not upload sensitive information that is not needed for reading practice."
      }
    ]
  },
  childrenPrivacy: {
    eyebrow: "Children's privacy",
    title: "Children's Privacy Notice",
    sections: [
      {
        heading: "Parent control",
        body: "A parent or caregiver should create and manage child learning access. The app should collect only the minimum data needed to provide personalized reading practice and progress tracking."
      },
      {
        heading: "Teacher access",
        body: "Teachers can only view a student's learning data after an assignment or invite relationship is active. Teachers cannot browse unrelated student data."
      },
      {
        heading: "COPPA-style operations",
        body: "Before a public launch, ReadNest should complete a legal review, consent workflow, deletion workflow, and vendor review for child-directed services."
      }
    ]
  },
  parentConsent: {
    eyebrow: "Consent",
    title: "Parent Consent",
    sections: [
      {
        heading: "What parents approve",
        body: "Parents approve storing practice progress, reading interactions, teacher assignment links, and subscription status so ReadNest can provide progress summaries and learning recommendations."
      },
      {
        heading: "AI consent",
        body: "Future AI recommendations must be opt-in, backend-generated, evidence-labeled, and presented as instructional support, not diagnosis."
      },
      {
        heading: "Cancel or delete",
        body: `Parents can cancel billing through Stripe Customer Portal and can request data deletion through ${supportConfig.email}.`
      }
    ]
  },
  teacherTerms: {
    eyebrow: "Teacher terms",
    title: "Teacher Terms",
    sections: [
      {
        heading: "Teacher verification",
        body: "Teacher certification is state-based. Production verification should collect issuing state and license details, then use admin review or a trusted verification provider before marking verified."
      },
      {
        heading: "Student data",
        body: "Teachers may only access students assigned to them. Reports and recommendations should be shared with parents in a concise, respectful, non-diagnostic way."
      },
      {
        heading: "Capacity",
        body: "Teacher load should stay visible so no teacher is assigned more students than they can reasonably support."
      }
    ]
  },
  refundPolicy: {
    eyebrow: "Billing",
    title: "Refund and Cancellation Policy",
    sections: [
      {
        heading: "Cancel monthly billing",
        body: "Families can cancel monthly billing through Stripe Customer Portal. Access should remain consistent with Stripe subscription status and billing period rules."
      },
      {
        heading: "Failed payments",
        body: "If a payment fails, premium access may be paused until billing is updated. Free activities remain available."
      },
      {
        heading: "Refund requests",
        body: `Refund requests should be sent to ${supportConfig.email}. Refunds and disputes must be reconciled through Stripe webhooks before paid entitlements are restored.`
      }
    ]
  }
};

export function LegalPage({ page }: LegalPageProps) {
  const content = legalContent[page];

  return (
    <article className="practice-panel legal-page">
      <p className="eyebrow">{content.eyebrow}</p>
      <h2>{content.title}</h2>
      <p className="helper-text">Last updated: June 21, 2026. This page is product guidance and should be reviewed by counsel before a full public launch.</p>
      <div className="legal-section-grid">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            <p className="helper-text">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
