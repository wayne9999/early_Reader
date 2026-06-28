export type AppView =
  | "reading"
  | "memory"
  | "progress"
  | "findTeacher"
  | "rhymes"
  | "soundSort"
  | "sentenceBuilder"
  | "storyOrder"
  | "wordMeaning"
  | "echoReader"
  | "voiceQuest"
  | "teacher"
  | "donate"
  | "support"
  | "privacy"
  | "terms"
  | "childrenPrivacy"
  | "parentConsent"
  | "teacherTerms"
  | "refundPolicy"
  | "account";

export type UserRole = "student" | "teacher" | "admin";

export type SignupPath = "parentChild" | "teacher";

export type SubscriptionTierId = "free" | "familyPlus" | "teacherPro";

export type SubscriptionStatus = "free" | "checkoutStarted" | "active" | "pastDue" | "canceled";

export type SubscriptionSource = "demo" | "stripe" | "adminGrant";

export type StudentGradeLevel = "K" | "1" | "2";

export type StudentReadingGoal = "confidence" | "phonics" | "sightWords" | "fluency";

export type SubscriptionRecord = {
  userId: string;
  tier: SubscriptionTierId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  currentPeriodEnd?: string | number | null;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  lastStripeEventId?: string | null;
  lastPaymentError?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};

export type PhonicsPrompt = {
  title: string;
  sounds: string[];
  word: string;
};

export type ReadingWord = {
  text: string;
  hint: string;
  phonics: PhonicsPrompt;
  sentence: string;
};

export type ReadingLevel = {
  id: string;
  label: string;
  focus: string;
  words: ReadingWord[];
};

export type MemoryCardContent = {
  id: string;
  label: string;
  category: string;
};

export type Progress = {
  knownWords: Record<string, number>;
  readingSessions: number;
  memoryWins: number;
  memoryMoves: number;
  memoryTurns: number;
  bestMemoryTurns: number | null;
  activityCompletions: number;
  completedToday: number;
  lastPracticeDate: string;
};

export type AppUser = {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider?: string;
};

export type EmailAuthInput = {
  email: string;
  password: string;
  displayName?: string;
  mode: "signIn" | "signUp";
};

export type UserProfile = {
  uid: string;
  role: UserRole;
  signupPath?: SignupPath;
  displayName: string;
  email: string | null;
  picture: string | null;
  teacherCode?: string;
  certificationState?: string;
  certificationId?: string;
  certificationStatus?: "notSubmitted" | "pendingReview" | "verified" | "rejected";
  certificationNote?: string;
  subscriptionTier?: SubscriptionTierId;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPromptSkippedAt?: string;
  bio?: string;
  gradeBands?: Array<"K" | "1" | "2">;
  specialties?: string[];
  maxStudentLoad?: number;
  activeStudentCount?: number;
  payModelNote?: string;
  gradeLevel?: StudentGradeLevel;
  readingGoal?: StudentReadingGoal;
  preferredPracticeMinutes?: number;
  parentConsentAccepted?: boolean;
  parentConsentAcceptedAt?: unknown;
  parentConsentVersion?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LearningEventType =
  | "reading_started"
  | "word_known"
  | "word_listened"
  | "word_skipped"
  | "reading_completed"
  | "sound_listened"
  | "sentence_listened"
  | "memory_started"
  | "memory_card_revealed"
  | "memory_match"
  | "memory_attempt"
  | "memory_completed"
  | "activity_started"
  | "activity_prompt_listened"
  | "activity_answer"
  | "activity_round_advanced"
  | "activity_completed";

export type LearningEvent = {
  id?: string;
  userId: string;
  type: LearningEventType;
  label: string;
  area: SkillArea;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: unknown;
};

export type TeacherStudentLink = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  status: "requested" | "active" | "declined";
  latestProgressSnapshot: Progress;
  requestedAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: unknown;
};

export type StudentPlacementStatus = "unassigned" | "requested" | "assigned";

export type StudentPlacementQueue = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  status: StudentPlacementStatus;
  holdingTeacherName?: string | null;
  requestedTeacherId?: string | null;
  requestedTeacherName?: string | null;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  latestProgressSnapshot: Progress;
  requestedAt?: unknown;
  assignedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};

export type TeacherInvite = {
  id: string;
  teacherId: string;
  teacherName: string;
  code: string;
  status: "active" | "revoked" | "expired" | "accepted";
  autoApprove: boolean;
  expiresAt: string;
  acceptedBy?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};

export type TeacherLoadStatus = "open" | "nearlyFull" | "full";

export type SocialProvider = "google" | "facebook" | "instagram";

export type SkillArea = "phonics" | "sightWords" | "fluency" | "workingMemory" | "consistency";

export type LearningActivity = {
  id: "rhymes" | "soundSort" | "sentenceBuilder" | "storyOrder" | "wordMeaning" | "echoReader" | "voiceQuest";
  title: string;
  shortLabel: string;
  routeLabel: string;
  eyebrow: string;
  skill: SkillArea;
  intro: string;
  voiceMode?: "standard" | "elevenLabs";
  rounds: LearningActivityRound[];
};

export type LearningActivityRound = {
  prompt: string;
  target: string;
  voicePrompt?: string;
  choices: string[];
  correctChoice: string;
  successMessage: string;
  coachMessage: string;
};

export type StudentSummary = {
  id: string;
  name: string;
  gradeBand: "K" | "1" | "2";
  lastActive: string;
  progress: Progress;
  email?: string | null;
  assignmentStatus?: TeacherStudentLink["status"];
  history?: LearningEvent[];
};

export type SkillInsight = {
  area: SkillArea;
  label: string;
  score: number;
  status: "strong" | "watch" | "needsSupport";
  evidence: string;
  nextStep: string;
};

export type TeacherAnalysis = {
  studentId: string;
  summary: string;
  strengths: SkillInsight[];
  growthAreas: SkillInsight[];
  recommendedPlan: string[];
  aiReadinessNote: string;
};

export type StudentAiInsight = {
  id?: string;
  studentId: string;
  status: "ready";
  summary: string;
  teacherSummary?: string;
  parentSummary?: string;
  nextBestActivity?: {
    title: string;
    route: string;
    reason: string;
    skillArea: SkillArea;
  };
  confidence?: "low" | "medium" | "high";
  strengths: Array<{
    area: SkillArea;
    label: string;
    evidence: string;
  }>;
  needsPractice: Array<{
    area: SkillArea;
    label: string;
    evidence: string;
    nextStep: string;
  }>;
  recommendedTeacherActions: string[];
  suggestedHomePractice: string[];
  skillFocusAreas?: SkillArea[];
  evidence: {
    sourceEventCount: number;
    topMissedItems: string[];
    topMasteredItems: string[];
    recentLabels?: string[];
  };
  guardrail?: {
    status: "passed" | "fallback" | "blocked";
    checkedAt?: unknown;
    notes: string[];
  };
  aiDisclosure: string;
  model: string;
  promptVersion: string;
  sourceDataWindow?: {
    limit: number;
    newestEventAt: unknown;
    oldestEventAt: unknown;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AiAnalysisJob = {
  id?: string;
  studentId: string;
  requestedBy: string;
  requestKind: "teacherRequested" | "scheduled" | "legacyRecommendation" | "thresholdTriggered";
  status: "queued" | "running" | "succeeded" | "failed";
  consentAccepted: boolean;
  insightId?: string;
  sourceEventCount?: number;
  error?: string;
  provider?: "rule-based" | "openai" | "openai-warning" | "budget-fallback" | string;
  providerError?: string | null;
  model?: string;
  budget?: {
    allowed: boolean;
    monthKey: string;
    mode: "openai" | "warning" | "fallback";
    reason: "within_budget" | "warning_limit" | "hard_limit";
    estimatedMonthlySpendUsd: number;
    warningLimitUsd: number;
    hardLimitUsd: number;
    reservedUsd: number;
  } | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  actualCostUsd?: number | null;
  queuedReason?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LearningCoachState = {
  studentId: string;
  status?: "collecting" | "queued" | "ready";
  activeJobId?: string | null;
  activeJobStatus?: AiAnalysisJob["status"] | null;
  activeJobRequestKind?: AiAnalysisJob["requestKind"] | null;
  eventsSinceLastInsight?: number;
  lastInsightId?: string | null;
  lastInsightAt?: unknown;
  lastQueuedAt?: unknown;
  lastEventId?: string | null;
  lastEventAt?: unknown;
  queuedReason?: string | null;
  currentRecommendation?: StudentAiInsight["nextBestActivity"] | null;
  skillFocusAreas?: SkillArea[];
  confidence?: StudentAiInsight["confidence"];
  providerModel?: string;
  guardrailStatus?: "passed" | "fallback" | "blocked" | string;
  consentAccepted?: boolean;
  thresholdEvents?: number;
  cooldownHours?: number;
  updatedAt?: unknown;
};

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string;
  price: string;
  audience: string;
  description: string;
  perks: string[];
  cta: string;
  paymentEnvKey?: string;
};

export type SupportCaseType = "general" | "billing" | "dataDeletion" | "teacherVerification" | "technical";

export type SupportCase = {
  id?: string;
  userId: string;
  type: SupportCaseType;
  subject: string;
  message: string;
  status: "open" | "inReview" | "resolved";
  contactEmail?: string | null;
  adminDetailUrl?: string | null;
  aiSummaryStatus?: "processing" | "ready" | "failed";
  aiSummaryProvider?: string | null;
  aiSummaryProviderError?: string | null;
  aiSummary?: string | null;
  aiUrgency?: "low" | "normal" | "high";
  aiCategory?: string | null;
  aiRecommendedNextSteps?: string[];
  aiCustomerReplyDraft?: string | null;
  aiSafetyFlags?: string[];
  emailNotificationStatus?: "pending" | "sent" | "skipped" | "failed";
  emailProviderMessage?: string | null;
  emailNotificationSentAt?: unknown;
  processingError?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};
