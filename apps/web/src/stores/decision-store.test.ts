import { describe, expect, test } from "vitest";
import { useDecisionStore } from "./decision-store";

describe("decisionStore", () => {
  test("starts with empty arrays", () => {
    const state = useDecisionStore.getState();
    expect(state.decisions).toEqual([]);
    expect(state.proposals).toEqual([]);
  });

  test("addDecision appends a decision", () => {
    const { addDecision } = useDecisionStore.getState();
    addDecision({
      id: "d1",
      actor: "ai",
      decision: "Added 3 modules",
      reason: "Required by project intent",
      projectId: "p1",
      createdAt: new Date(),
    });
    expect(useDecisionStore.getState().decisions).toHaveLength(1);
  });

  test("addProposal appends a proposal", () => {
    const { addProposal } = useDecisionStore.getState();
    addProposal({
      id: "p1",
      agentType: "module",
      riskTier: "medium",
      title: "Add sensor module",
      description: "Temperature sensor needed",
      reason: "Project requirements specify environmental sensing",
      projectId: "p1",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(useDecisionStore.getState().proposals).toHaveLength(1);
  });

  test("updateProposalStatus changes proposal status", () => {
    const { addProposal, updateProposalStatus } = useDecisionStore.getState();
    addProposal({
      id: "p2",
      agentType: "circuit",
      riskTier: "high",
      title: "Change MCU",
      description: "Replace MCU with faster variant",
      reason: "Current MCU can't meet performance requirements",
      projectId: "p1",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    updateProposalStatus("p2", "approved");
    const proposal = useDecisionStore.getState().proposals.find((p) => p.id === "p2");
    expect(proposal?.status).toBe("approved");
  });

  test("clear empties decisions and proposals", () => {
    const { addDecision, addProposal, clear } = useDecisionStore.getState();
    addDecision({
      id: "d1",
      actor: "ai",
      decision: "test",
      reason: "test",
      projectId: "p1",
      createdAt: new Date(),
    });
    addProposal({
      id: "p1",
      agentType: "module",
      riskTier: "low",
      title: "test",
      description: "test",
      reason: "test",
      projectId: "p1",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    clear();
    expect(useDecisionStore.getState().decisions).toEqual([]);
    expect(useDecisionStore.getState().proposals).toEqual([]);
  });
});
