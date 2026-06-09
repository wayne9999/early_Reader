export type AppView = "reading" | "memory" | "progress" | "teacher" | "support" | "account";

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

export type SocialProvider = "google" | "facebook" | "instagram";

export type SkillArea = "phonics" | "sightWords" | "fluency" | "workingMemory" | "consistency";

export type StudentSummary = {
  id: string;
  name: string;
  gradeBand: "K" | "1" | "2";
  lastActive: string;
  progress: Progress;
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
