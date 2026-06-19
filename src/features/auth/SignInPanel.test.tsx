import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPanel } from "./SignInPanel";

const signIn = vi.fn();
const signInWithEmail = vi.fn();
const signOut = vi.fn();

vi.mock("./AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    mode: "firebase",
    signIn,
    signInWithEmail,
    signOut,
    user: null
  })
}));

describe("SignInPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    signIn.mockReset();
    signInWithEmail.mockReset();
    signOut.mockReset();
  });

  it("starts with the parent child signup path selected", () => {
    render(<SignInPanel />);

    expect(screen.getByText("Parent / Child signup selected")).toBeInTheDocument();
    expect(
      within(screen.getByRole("radiogroup", { name: /choose account type/i })).getByRole("button", {
        name: /choose parent \/ child signup/i
      })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the target page when a protected route sends the user to sign in", () => {
    render(<SignInPanel redirectView="teacher" />);

    expect(screen.getByText("Sign in to continue to Teacher dashboard.")).toBeInTheDocument();
    expect(screen.getByText(/open the page from your shared link/i)).toBeInTheDocument();
    expect(screen.getByText("Teacher signup selected")).toBeInTheDocument();
  });

  it("saves teacher intent and submits email signup details", async () => {
    const user = userEvent.setup();
    signInWithEmail.mockResolvedValue(undefined);

    render(<SignInPanel />);

    await user.click(
      within(screen.getByRole("radiogroup", { name: /choose account type/i })).getByRole("button", {
        name: /choose teacher signup/i
      })
    );
    await user.type(screen.getByLabelText(/display name/i), "Mrs. Baker");
    await user.type(screen.getByLabelText(/^email$/i), "teacher@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /create teacher account/i }));

    expect(localStorage.getItem("readnest-signup-intent-v1")).toBe("teacher");
    expect(signInWithEmail).toHaveBeenCalledWith({
      email: "teacher@example.com",
      password: "secret123",
      displayName: "Mrs. Baker",
      mode: "signUp"
    });
  });

  it("does not overwrite signup intent when returning users sign in with email", async () => {
    const user = userEvent.setup();
    signInWithEmail.mockResolvedValue(undefined);

    render(<SignInPanel />);

    await user.click(
      within(screen.getByRole("group", { name: /email account action/i })).getByRole("button", {
        name: /^sign in$/i
      })
    );
    await user.type(screen.getByLabelText(/^email$/i), "reader@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in with email/i }));

    expect(localStorage.getItem("readnest-signup-intent-v1")).toBeNull();
    expect(signInWithEmail).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "secret123",
      displayName: "",
      mode: "signIn"
    });
  });
});
