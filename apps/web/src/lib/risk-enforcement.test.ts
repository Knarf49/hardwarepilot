import { describe, expect, test } from "vitest";
import { getProposalAction } from "./risk-enforcement";

describe("getProposalAction", () => {
  test("low risk returns auto", () => {
    expect(getProposalAction("low")).toBe("auto");
  });

  test("medium risk returns approval", () => {
    expect(getProposalAction("medium")).toBe("approval");
  });

  test("high risk returns approval", () => {
    expect(getProposalAction("high")).toBe("approval");
  });
});
