import { FieldValue, type DocumentData } from "firebase-admin/firestore";

export type SupportCaseSummary = {
  summary: string;
  urgency: "low" | "normal" | "high";
  category: string;
  recommendedNextSteps: string[];
  customerReplyDraft: string;
  safetyFlags: string[];
};

type SupportCaseInput = {
  id: string;
  userId: string;
  type?: string;
  subject?: string;
  message?: string;
  contactEmail?: string | null;
};

const fallbackStepsByType: Record<string, string[]> = {
  billing: ["Check Stripe customer/subscription state.", "Reply with billing portal or refund/cancellation guidance."],
  dataDeletion: ["Verify requester identity before deleting data.", "Confirm which account, child profile, and learning history should be removed."],
  teacherVerification: ["Review teacher profile and certification details.", "Ask for missing state/license information if needed."],
  technical: ["Ask for device, browser, URL, and reproduction steps.", "Check Cloud Logging for matching errors around the submitted time."],
  general: ["Review the full message and reply with the next best support step."]
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ").slice(0, 1200) : fallback;
}

function fallbackSupportSummary(input: SupportCaseInput): SupportCaseSummary {
  const type = cleanText(input.type, "general");
  const subject = cleanText(input.subject, "Support request");

  return {
    summary: `${subject}. A signed-in user submitted a ${type} support request that needs admin review.`,
    urgency: type === "billing" || type === "dataDeletion" ? "high" : "normal",
    category: type,
    recommendedNextSteps: fallbackStepsByType[type] ?? fallbackStepsByType.general,
    customerReplyDraft: "Thanks for contacting ReadNest. We received your request and will review the details before replying with the next step.",
    safetyFlags: []
  };
}

function normalizeSupportSummary(payload: unknown, fallback: SupportCaseSummary): SupportCaseSummary {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const urgency = source.urgency === "low" || source.urgency === "normal" || source.urgency === "high"
    ? source.urgency
    : fallback.urgency;

  return {
    summary: cleanText(source.summary, fallback.summary).slice(0, 800),
    urgency,
    category: cleanText(source.category, fallback.category).slice(0, 80),
    recommendedNextSteps: Array.isArray(source.recommendedNextSteps)
      ? source.recommendedNextSteps
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => cleanText(item).slice(0, 220))
        .slice(0, 5)
      : fallback.recommendedNextSteps,
    customerReplyDraft: cleanText(source.customerReplyDraft, fallback.customerReplyDraft).slice(0, 800),
    safetyFlags: Array.isArray(source.safetyFlags)
      ? source.safetyFlags
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => cleanText(item).slice(0, 120))
        .slice(0, 5)
      : fallback.safetyFlags
  };
}

function outputTextFromResponsesApi(response: unknown) {
  const data = response && typeof response === "object" ? response as Record<string, unknown> : {};

  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item) => {
      const outputItem = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return Array.isArray(outputItem.content) ? outputItem.content : [];
    })
    .map((content) => {
      const contentItem = content && typeof content === "object" ? content as Record<string, unknown> : {};
      return typeof contentItem.text === "string" ? contentItem.text : "";
    })
    .join("");
}

export async function summarizeSupportCase(options: {
  apiKey?: string;
  model: string;
  supportCase: SupportCaseInput;
}): Promise<{ summary: SupportCaseSummary; provider: string; providerError: string | null }> {
  const fallback = fallbackSupportSummary(options.supportCase);

  if (!options.apiKey) {
    return { summary: fallback, provider: "rule-based", providerError: null };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        store: false,
        input: [
          {
            role: "system",
            content:
              "You summarize support requests for a child-focused reading app. Be concise, operational, and privacy-aware. Do not include payment card details, diagnosis, or unnecessary child-identifying information."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create an internal support triage summary.",
              supportCase: {
                id: options.supportCase.id,
                userId: options.supportCase.userId,
                type: options.supportCase.type,
                subject: options.supportCase.subject,
                message: options.supportCase.message,
                contactEmailPresent: Boolean(options.supportCase.contactEmail)
              }
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "readnest_support_case_summary",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["summary", "urgency", "category", "recommendedNextSteps", "customerReplyDraft", "safetyFlags"],
              properties: {
                summary: { type: "string" },
                urgency: { type: "string", enum: ["low", "normal", "high"] },
                category: { type: "string" },
                recommendedNextSteps: {
                  type: "array",
                  maxItems: 5,
                  items: { type: "string" }
                },
                customerReplyDraft: { type: "string" },
                safetyFlags: {
                  type: "array",
                  maxItems: 5,
                  items: { type: "string" }
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI support summary failed with ${response.status}`);
    }

    const responseData = await response.json();
    const text = outputTextFromResponsesApi(responseData);

    return {
      summary: normalizeSupportSummary(JSON.parse(text), fallback),
      provider: options.model,
      providerError: null
    };
  } catch (error) {
    return {
      summary: fallback,
      provider: "rule-based",
      providerError: error instanceof Error ? error.message : "OpenAI support summary failed"
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendSupportSummaryEmail(options: {
  resendApiKey?: string;
  fromEmail: string;
  toEmail: string;
  supportCase: SupportCaseInput;
  summary: SupportCaseSummary;
  detailUrl: string;
}) {
  if (!options.resendApiKey || options.resendApiKey === "not_configured") {
    return { status: "skipped", providerMessage: "RESEND_API_KEY is not configured." };
  }

  const subject = `[ReadNest support] ${options.summary.urgency.toUpperCase()} - ${cleanText(options.supportCase.subject, "New support case")}`;
  const steps = options.summary.recommendedNextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const html = `
    <h2>ReadNest support request</h2>
    <p><strong>Type:</strong> ${escapeHtml(cleanText(options.supportCase.type, "general"))}</p>
    <p><strong>User ID:</strong> ${escapeHtml(options.supportCase.userId)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(options.supportCase.contactEmail ?? "No contact email")}</p>
    <p><strong>AI summary:</strong> ${escapeHtml(options.summary.summary)}</p>
    <p><strong>Urgency:</strong> ${escapeHtml(options.summary.urgency)}</p>
    <p><strong>Detailed message:</strong> <a href="${escapeHtml(options.detailUrl)}">Open support case in Firebase</a></p>
    <h3>Recommended next steps</h3>
    <ol>${steps}</ol>
  `;
  const text = [
    "ReadNest support request",
    `Type: ${cleanText(options.supportCase.type, "general")}`,
    `User ID: ${options.supportCase.userId}`,
    `Contact: ${options.supportCase.contactEmail ?? "No contact email"}`,
    `AI summary: ${options.summary.summary}`,
    `Urgency: ${options.summary.urgency}`,
    `Detailed message: ${options.detailUrl}`,
    "Recommended next steps:",
    ...options.summary.recommendedNextSteps.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: options.fromEmail,
      to: [options.toEmail],
      subject,
      html,
      text
    })
  });

  const parsedResponse = await response.json().catch(() => ({}));
  const responseData = parsedResponse && typeof parsedResponse === "object" ? parsedResponse as DocumentData : {};

  if (!response.ok) {
    throw new Error(typeof responseData.message === "string" ? responseData.message : `Resend failed with ${response.status}`);
  }

  return {
    status: "sent",
    providerMessage: typeof responseData.id === "string" ? responseData.id : "sent",
    sentAt: FieldValue.serverTimestamp()
  };
}
