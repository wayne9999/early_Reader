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
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LearningEventType =
  | "word_known"
  | "reading_completed"
  | "sound_listened"
  | "sentence_listened"
  | "memory_match"
  | "memory_attempt"
  | "memory_completed"
  | "activity_answer"
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
  id: "rhymes" | "soundSort" | "sentenceBuilder" | "storyOrder" | "wordMeaning";
  title: string;
  shortLabel: string;
  routeLabel: string;
  eyebrow: string;
  skill: SkillArea;
  intro: string;
  rounds: LearningActivityRound[];
};

export type LearningActivityRound = {
  prompt: string;
  target: string;
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
