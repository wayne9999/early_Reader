import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { getFirebaseRuntime } from "../../services/firebase";
import type { AppUser, SocialProvider } from "../../types";

type FirebaseAuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: SocialProvider) => Promise<void>;
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

        if (provider === "instagram") {
          window.alert("Instagram sign-in needs a custom provider or Auth0 connection. Google and Facebook are ready for Firebase.");
          return;
        }

        const authProvider = provider === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
        await signInWithPopup(runtime.auth, authProvider);
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
