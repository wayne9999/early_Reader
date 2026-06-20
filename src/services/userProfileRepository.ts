import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AppUser, SignupPath, UserProfile, UserRole } from "../types";
import { getFirebaseRuntime } from "./firebase";

const PROFILE_STORAGE_KEY = "readnest-profile-v1";

function localProfileKey(user: AppUser) {
  return `${PROFILE_STORAGE_KEY}:${user.id}`;
}

function createTeacherCode(name: string, uid: string) {
  const prefix = name
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 5)
    .toUpperCase()
    .padEnd(5, "READ");

  return `${prefix}-${uid.slice(0, 5).toUpperCase()}`;
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;
}

function buildProfile(user: AppUser, role: UserRole, signupPath?: SignupPath): UserProfile {
  const teacherDetails = role === "teacher"
    ? {
        teacherCode: createTeacherCode(user.name, user.id),
        certificationStatus: "notSubmitted" as const,
        certificationNote:
          "Teacher certification is state-based. Collect state and license details, then verify through the issuing state agency before marking verified.",
        bio:
          "I support early readers with short, calm practice, phonics modeling, and teacher-reviewed next steps.",
        gradeBands: ["K", "1", "2"] as UserProfile["gradeBands"],
        specialties: ["phonics", "sight words", "reading confidence"],
        maxStudentLoad: 12,
        activeStudentCount: 0,
        payModelNote: "Teacher support is paid based on active assigned students."
      }
    : {};

  return {
    uid: user.id,
    role,
    signupPath,
    displayName: user.name,
    email: user.email ?? null,
    picture: user.picture ?? null,
    subscriptionTier: role === "teacher" ? "teacherPro" : "free",
    subscriptionStatus: "free",
    ...teacherDetails
  };
}

export async function loadUserProfile(user: AppUser | null): Promise<UserProfile | null> {
  if (!user) {
    return null;
  }

  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    const rawProfile = localStorage.getItem(localProfileKey(user));
    return rawProfile ? (JSON.parse(rawProfile) as UserProfile) : null;
  }

  const profileRef = doc(runtime.db, "users", firebaseUser.uid);
  const snapshot = await getDoc(profileRef);
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function createUserProfile(user: AppUser, role: UserRole, signupPath?: SignupPath): Promise<UserProfile> {
  const existingProfile = await loadUserProfile(user);

  if (existingProfile) {
    return existingProfile;
  }

  const profile = buildProfile(user, role, signupPath);
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    localStorage.setItem(localProfileKey(user), JSON.stringify(profile));
    return profile;
  }

  await setDoc(
    doc(runtime.db, "users", firebaseUser.uid),
    {
      ...removeUndefinedFields(profile),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  if (role === "teacher") {
    await setDoc(
      doc(runtime.db, "teacherProfiles", firebaseUser.uid),
      removeUndefinedFields({
        uid: firebaseUser.uid,
        displayName: profile.displayName,
        email: profile.email,
        picture: profile.picture,
        teacherCode: profile.teacherCode,
        certificationState: profile.certificationState,
        certificationId: profile.certificationId,
        certificationStatus: profile.certificationStatus,
        certificationNote: profile.certificationNote,
        bio: profile.bio,
        gradeBands: profile.gradeBands,
        specialties: profile.specialties,
        maxStudentLoad: profile.maxStudentLoad,
        activeStudentCount: profile.activeStudentCount,
        payModelNote: profile.payModelNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }),
      { merge: true }
    );

    await setDoc(
      doc(runtime.db, "teacherDirectory", firebaseUser.uid),
      removeUndefinedFields({
        uid: firebaseUser.uid,
        displayName: profile.displayName,
        email: profile.email,
        teacherCode: profile.teacherCode,
        certificationState: profile.certificationState,
        certificationStatus: profile.certificationStatus,
        certificationNote: profile.certificationNote,
        bio: profile.bio,
        gradeBands: profile.gradeBands,
        specialties: profile.specialties,
        maxStudentLoad: profile.maxStudentLoad,
        activeStudentCount: profile.activeStudentCount,
        payModelNote: profile.payModelNote,
        updatedAt: serverTimestamp()
      }),
      { merge: true }
    );
  }

  return profile;
}

export async function updateUserProfile(
  user: AppUser,
  profile: UserProfile,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const nextProfile = {
    ...profile,
    ...updates
  };
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    localStorage.setItem(localProfileKey(user), JSON.stringify(nextProfile));
    return nextProfile;
  }

  await setDoc(
    doc(runtime.db, "users", firebaseUser.uid),
    {
      ...removeUndefinedFields(updates),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return nextProfile;
}
