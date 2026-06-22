import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleSetup } from "./RoleSetup";
import { createUserProfile } from "../../services/userProfileRepository";

vi.mock("../../services/userProfileRepository", () => ({
  createUserProfile: vi.fn()
}));

describe("RoleSetup", () => {
  beforeEach(() => {
    vi.mocked(createUserProfile).mockReset();
  });

  it("requires parent consent before creating the selected parent child role", async () => {
    const userEventApi = userEvent.setup();
    const onProfileCreated = vi.fn();
    vi.mocked(createUserProfile).mockResolvedValue({
      uid: "student-1",
      role: "student",
      signupPath: "parentChild",
      displayName: "Jayden",
      email: "jayden@example.com",
      picture: null
    });

    render(
      <RoleSetup
        user={{ id: "student-1", name: "Jayden", email: "jayden@example.com" }}
        preferredSignupPath="parentChild"
        onProfileCreated={onProfileCreated}
      />
    );

    expect(screen.queryByRole("button", { name: /^teacher/i })).not.toBeInTheDocument();
    expect(screen.getByText("Parent / Child path selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create parent \/ child profile/i })).toBeDisabled();
    expect(createUserProfile).not.toHaveBeenCalled();

    await userEventApi.click(screen.getByRole("checkbox"));
    await userEventApi.click(screen.getByRole("button", { name: /create parent \/ child profile/i }));

    await waitFor(() => {
      expect(createUserProfile).toHaveBeenCalledWith(
        { id: "student-1", name: "Jayden", email: "jayden@example.com" },
        "student",
        "parentChild",
        { parentConsentAccepted: true }
      );
    });
    expect(onProfileCreated).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
  });

  it("auto-creates teacher profiles from the selected teacher path", async () => {
    const onProfileCreated = vi.fn();
    vi.mocked(createUserProfile).mockResolvedValue({
      uid: "teacher-1",
      role: "teacher",
      signupPath: "teacher",
      displayName: "Mrs. Baker",
      email: "teacher@example.com",
      picture: null
    });

    render(
      <RoleSetup
        user={{ id: "teacher-1", name: "Mrs. Baker", email: "teacher@example.com" }}
        preferredSignupPath="teacher"
        onProfileCreated={onProfileCreated}
      />
    );

    await waitFor(() => {
      expect(createUserProfile).toHaveBeenCalledWith(
        { id: "teacher-1", name: "Mrs. Baker", email: "teacher@example.com" },
        "teacher",
        "teacher",
        { parentConsentAccepted: undefined }
      );
    });
  });

  it("keeps manual role choices only when no signup path exists", () => {
    render(
      <RoleSetup
        user={{ id: "user-1", name: "User" }}
        preferredSignupPath={null}
        onProfileCreated={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /^parent \/ child/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^teacher/i })).toBeInTheDocument();
    expect(createUserProfile).not.toHaveBeenCalled();
  });
});
