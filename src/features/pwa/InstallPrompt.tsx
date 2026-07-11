import { useEffect, useState } from "react";
import { trackProductEvent } from "../../services/productAnalytics";

// Chromium exposes a beforeinstallprompt event that we can defer and fire
// when the user opts in. Safari has no equivalent; iOS installs happen
// through the share sheet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "readnest-install-prompt-dismissed-v1";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY));
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      return;
    }

    // Already installed / running standalone — never show.
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) {
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
    void trackProductEvent(null, "paywall_viewed", { surface: "install_prompt_dismissed" });
  };

  const install = async () => {
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      void trackProductEvent(null, "onboarding_completed", {
        surface: "install_prompt",
        outcome
      });
      if (outcome === "dismissed") {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    } catch {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } finally {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <aside className="install-prompt" role="dialog" aria-labelledby="install-prompt-title">
      <div>
        <p className="eyebrow">Install ReadNest</p>
        <p id="install-prompt-title">Add ReadNest to your home screen for one-tap reading practice, even offline.</p>
      </div>
      <div className="install-prompt-actions">
        <button className="primary-button" type="button" onClick={() => void install()}>
          Add to home screen
        </button>
        <button className="secondary-button" type="button" onClick={dismiss}>
          Not now
        </button>
      </div>
    </aside>
  );
}
