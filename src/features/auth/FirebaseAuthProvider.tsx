import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { getFirebaseRuntime } from "../../services/firebase";
import type { AppUser, EmailAuthInput, SocialProvider } from "../../types";

type FirebaseAuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: SocialProvider) => Promise<void>;
  signInWithEmail: (input: EmailAuthInput) => Promise<void>;
  signOut: () => Promise<void>;
  mode: "firebase";
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

function toAppUser(user: User): AppUser {
  return {
    id: user.uid,
    name: user.displayName ?? user.email ?? "Reader",
    email: user.email ?? undefined,
    picture: user.photoURL ?? undefined,
    provider: user.providerData[0]?.providerId ?? "firebase"
  };
}

export function FirebaseReadNestAuthProvider({ children }: PropsWithChildren) {
  const runtime = getFirebaseRuntime();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(runtime));

  useEffect(() => {
    if (!runtime) {
      setIsLoading(false);
      return undefined;
    }

    return onAuthStateChanged(runtime.auth, (firebaseUser) => {
      setUser(firebaseUser ? toAppUser(firebaseUser) : null);
      setIsLoading(false);
    });
  }, [runtime]);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      mode: "firebase",
      async signIn(provider) {
        if (!runtime) {
          return;
        }

        const authProvider = provider === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();

        if (provider === "facebook") {
          authProvider.addScope("email");
          authProvider.addScope("public_profile");
        }

        try {
          await signInWithPopup(runtime.auth, authProvider);
        } catch (error) {
          if (error instanceof FirebaseError && error.code === "auth/operation-not-allowed") {
            throw new Error("Facebook sign-in is not enabled in Firebase yet. Enable Facebook under Firebase Auth sign-in providers.");
          }

          throw error;
        }
      },
      async signInWithEmail(input) {
        if (!runtime) {
          return;
        }

        if (input.mode === "signUp") {
          const credential = await createUserWithEmailAndPassword(runtime.auth, input.email, input.password);

          if (input.displayName?.trim()) {
            await updateProfile(credential.user, {
              displayName: input.displayName.trim()
            });
            setUser(toAppUser(credential.user));
          }
          return;
        }

        await signInWithEmailAndPassword(runtime.auth, input.email, input.password);
      },
      async signOut() {
        if (runtime) {
          await firebaseSignOut(runtime.auth);
        }
      }
    }),
    [isLoading, runtime, user]
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error("useFirebaseAuth must be used inside FirebaseReadNestAuthProvider");
  }

  return context;
}
