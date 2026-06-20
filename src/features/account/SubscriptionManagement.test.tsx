import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubscriptionManagement } from "./SubscriptionManagement";
import type { UserProfile } from "../../types";

const studentProfile: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Reader",
  email: "reader@example.com",
  picture: null,
  subscriptionTier: "familyPlus",
  subscriptionStatus: "active"
};

describe("SubscriptionManagement", () => {
  it("shows monthly billing controls for student accounts", () => {
    render(<SubscriptionManagement profile={studentProfile} />);

    expect(screen.getByRole("heading", { name: /manage monthly billing/i })).toBeInTheDocument();
    expect(screen.getByText(/family plus active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manage or cancel subscription/i })).toBeInTheDocument();
  });

  it("does not show billing controls for teacher accounts", () => {
    const { container } = render(
      <SubscriptionManagement
        profile={{
          uid: "teacher-1",
          role: "teacher",
          displayName: "Teacher",
          email: "teacher@example.com",
          picture: null
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
