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
  | "account";

export type UserRole = "student" | "teacher" | "admin";

export type SignupPath = "parentChild" | "teacher";

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
  | "memory_completed"
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
  id: "free" | "familyPlus" | "teacherPro";
  name: string;
  price: string;
  audience: string;
  description: string;
  perks: string[];
  cta: string;
  paymentEnvKey?: string;
};
