import { render, screen, waitFor } from "@testing-library/react";
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

  it("auto-creates the selected parent child role without asking again", async () => {
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

    expect(screen.queryByRole("button", { name: /parent \/ child/i })).not.toBeInTheDocument();
    expect(screen.getByText("Parent / Child path selected")).toBeInTheDocument();

    await waitFor(() => {
      expect(createUserProfile).toHaveBeenCalledWith(
        { id: "student-1", name: "Jayden", email: "jayden@example.com" },
        "student",
        "parentChild"
      );
    });
    expect(onProfileCreated).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
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
