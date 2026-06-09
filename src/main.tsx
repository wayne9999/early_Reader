import React from "react";
import ReactDOM from "react-dom/client";
import { RootApp } from "./RootApp";
import { ReadNestAuthProvider } from "./features/auth/AuthProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ReadNestAuthProvider>
      <RootApp />
    </ReadNestAuthProvider>
  </React.StrictMode>
);
