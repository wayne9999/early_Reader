import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";
import { reportRuntimeError } from "../../services/errorReporting";

vi.mock("../../services/errorReporting", () => ({
  reportRuntimeError: vi.fn().mockResolvedValue("event-1")
}));

function Boom(): JSX.Element {
  throw new Error("something exploded");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.mocked(reportRuntimeError).mockClear();
    // React logs the caught error via console.error; silence it in tests.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>ok</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("shows the recovery panel and reports the error when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload the page/i })).toBeInTheDocument();
    expect(reportRuntimeError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "react-error-boundary",
        message: "something exploded"
      })
    );
  });
});
