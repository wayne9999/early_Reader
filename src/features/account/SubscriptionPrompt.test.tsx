import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionPrompt } from "./SubscriptionPrompt";
import { updateUserProfile } from "../../services/userProfileRepository";
import type { UserProfile } from "../../types";

vi.mock("../../services/userProfileRepository", () => ({
  updateUserProfile: vi.fn()
}));

const user = { id: "student-1", name: "Reader", email: "reader@example.com" };
const profile: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Reader",
  email: "reader@example.com",
  picture: null,
  subscriptionTier: "free",
  subscriptionStatus: "free"
};

describe("SubscriptionPrompt", () => {
  beforeEach(() => {
    vi.mocked(updateUserProfile).mockReset();
  });

  it("lets families skip and continue on the free plan", async () => {
    const userEventApi = userEvent.setup();
    const onProfileUpdated = vi.fn();
    const onContinue = vi.fn();
    vi.mocked(updateUserProfile).mockResolvedValue({
      ...profile,
      subscriptionPromptSkippedAt: "today"
    });

    render(
      <SubscriptionPrompt
        user={user}
        profile={profile}
        onProfileUpdated={onProfileUpdated}
        onContinue={onContinue}
      />
    );

    await userEventApi.click(screen.getByRole("button", { name: /skip for now/i }));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(
        user,
        profile,
        expect.objectContaining({
          subscriptionTier: "free",
          subscriptionStatus: "free"
        })
      );
    });
    expect(onProfileUpdated).toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalled();
  });

  it("shows the teacher plan for teacher accounts", () => {
    render(
      <SubscriptionPrompt
        user={{ id: "teacher-1", name: "Teacher", email: "teacher@example.com" }}
        profile={{
          uid: "teacher-1",
          role: "teacher",
          displayName: "Teacher",
          email: "teacher@example.com",
          picture: null,
          subscriptionTier: "free",
          subscriptionStatus: "free"
        }}
        onProfileUpdated={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /unlock the student insight workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start teacher pro/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start family plus/i })).not.toBeInTheDocument();
  });
});
