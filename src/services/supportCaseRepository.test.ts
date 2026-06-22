import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupportCase } from "./supportCaseRepository";

vi.mock("./firebase", () => ({
  getFirebaseRuntime: () => null
}));

describe("supportCaseRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores signed-in support cases with safe trimmed text", async () => {
    const supportCase = await createSupportCase(
      { id: "parent-1", name: "Parent", email: "parent@example.com" },
      {
        type: "dataDeletion",
        subject: "  Delete child data  ",
        message: "  Please delete the child learning history.  "
      }
    );

    expect(supportCase).toMatchObject({
      userId: "parent-1",
      type: "dataDeletion",
      subject: "Delete child data",
      message: "Please delete the child learning history.",
      contactEmail: "parent@example.com",
      status: "open"
    });
    expect(JSON.parse(localStorage.getItem("readnest-support-cases-v1") ?? "[]")).toHaveLength(1);
  });

  it("requires a subject and message", async () => {
    await expect(createSupportCase(
      { id: "parent-1", name: "Parent" },
      {
        type: "general",
        subject: "",
        message: ""
      }
    )).rejects.toThrow(/subject and message/i);
  });
});
