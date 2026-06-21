import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubscriptionManagement } from "./SubscriptionManagement";
import type { SubscriptionRecord, UserProfile } from "../../types";

const studentProfile: UserProfile = {
  uid: "student-1",
  role: "student",
  displayName: "Reader",
  email: "reader@example.com",
  picture: null,
  subscriptionTier: "familyPlus",
  subscriptionStatus: "active"
};

const familyPlusSubscription: SubscriptionRecord = {
  userId: "student-1",
  tier: "familyPlus",
  status: "active",
  source: "stripe"
};

describe("SubscriptionManagement", () => {
  it("shows monthly billing controls for student accounts", () => {
    render(<SubscriptionManagement profile={studentProfile} subscription={familyPlusSubscription} />);

    expect(screen.getByRole("heading", { name: /manage monthly billing/i })).toBeInTheDocument();
    expect(screen.getByText(/family plus active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manage or cancel subscription/i })).toBeInTheDocument();
  });

  it("shows failed payment guidance for past due subscriptions", () => {
    render(
      <SubscriptionManagement
        profile={studentProfile}
        subscription={{
          ...familyPlusSubscription,
          status: "pastDue",
          lastPaymentError: "card_declined"
        }}
      />
    );

    expect(screen.getByText(/payment needs attention/i)).toBeInTheDocument();
    expect(screen.getByText(/last payment did not complete/i)).toBeInTheDocument();
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
        subscription={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
