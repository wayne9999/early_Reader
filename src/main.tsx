import React from "react";
import ReactDOM from "react-dom/client";
import { RootApp } from "./RootApp";
import { ReadNestAuthProvider } from "./features/auth/AuthProvider";
import { ErrorBoundary } from "./features/errors/ErrorBoundary";
import { installGlobalErrorListeners } from "./services/errorReporting";
import { registerServiceWorker } from "./services/serviceWorkerRegistration";
import { installDeepLinkHandler } from "./platform/nativeDeepLinks";
import "./styles.css";

installGlobalErrorListeners();
registerServiceWorker();
void installDeepLinkHandler();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReadNestAuthProvider>
        <RootApp />
      </ReadNestAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
