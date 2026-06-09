import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AppUser, UserProfile, UserRole } from "../types";
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

function buildProfile(user: AppUser, role: UserRole): UserProfile {
  return {
    uid: user.id,
    role,
    displayName: user.name,
    email: user.email ?? null,
    picture: user.picture ?? null,
    teacherCode: role === "teacher" ? createTeacherCode(user.name, user.id) : undefined
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

export async function createUserProfile(user: AppUser, role: UserRole): Promise<UserProfile> {
  const existingProfile = await loadUserProfile(user);

  if (existingProfile) {
    return existingProfile;
  }

  const profile = buildProfile(user, role);
  const runtime = getFirebaseRuntime();
  const firebaseUser = runtime?.auth.currentUser;

  if (!runtime || !firebaseUser) {
    localStorage.setItem(localProfileKey(user), JSON.stringify(profile));
    return profile;
  }

  await setDoc(
    doc(runtime.db, "users", firebaseUser.uid),
    {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  if (role === "teacher") {
    await setDoc(
      doc(runtime.db, "teacherProfiles", firebaseUser.uid),
      {
        uid: firebaseUser.uid,
        displayName: profile.displayName,
        email: profile.email,
        picture: profile.picture,
        teacherCode: profile.teacherCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return profile;
}
