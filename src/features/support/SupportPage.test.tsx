import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupportPage } from "./SupportPage";

describe("SupportPage", () => {
  it("renders a mission-focused donation page", () => {
    render(<SupportPage initialFocus="donation" />);

    expect(screen.getByRole("heading", { name: /help children keep reading practice within reach/i })).toBeInTheDocument();
    expect(screen.getByText(/where gifts go/i)).toBeInTheDocument();
    expect(screen.getByText(/secure checkout opens with stripe/i)).toBeInTheDocument();
  });

  it("renders a help-center support page with package deals as a section", () => {
    render(<SupportPage />);

    expect(screen.getByRole("heading", { name: /support center for families and teachers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /email support/i })).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(screen.getByText(/common fixes/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /package deals/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /help children keep reading practice within reach/i })).not.toBeInTheDocument();
  });

  it("shows only the plan matching the signed-in role", () => {
    const { rerender } = render(
      <SupportPage
        user={{ id: "student-1", name: "Reader" }}
        profile={{ uid: "student-1", role: "student", displayName: "Reader", email: "reader@example.com", picture: null }}
      />
    );

    expect(screen.getByRole("heading", { name: "Family Plus" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Teacher Pro" })).not.toBeInTheDocument();

    rerender(
      <SupportPage
        user={{ id: "teacher-1", name: "Teacher" }}
        profile={{ uid: "teacher-1", role: "teacher", displayName: "Teacher", email: "teacher@example.com", picture: null }}
      />
    );

    expect(screen.getByRole("heading", { name: "Teacher Pro" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Family Plus" })).not.toBeInTheDocument();
  });
});
