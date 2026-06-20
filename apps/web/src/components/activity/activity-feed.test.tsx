import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useDecisionStore } from "@/stores/decision-store";
import { ActivityFeed } from "./activity-feed";

describe("ActivityFeed", () => {
  test("shows empty state when no items", () => {
    useDecisionStore.getState().clear();
    render(<ActivityFeed projectId="test" />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  test("displays a decision", () => {
    useDecisionStore.getState().clear();
    useDecisionStore.getState().addDecision({
      id: "d1",
      projectId: "test",
      actor: "ai",
      decision: "Created 3 modules",
      reason: "Based on project requirements",
      createdAt: new Date(),
    });
    render(<ActivityFeed projectId="test" />);
    expect(screen.getByText("Created 3 modules")).toBeInTheDocument();
    expect(screen.getByText(/ai/i)).toBeInTheDocument();
  });

  test("displays pending proposal with approve/reject buttons", () => {
    useDecisionStore.getState().clear();
    useDecisionStore.getState().addProposal({
      id: "p1",
      projectId: "test",
      agentType: "module",
      riskTier: "medium",
      title: "Add sensor",
      description: "Temperature sensor needed",
      reason: "Environmental sensing required",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    render(<ActivityFeed projectId="test" />);
    expect(screen.getByText("Add sensor")).toBeInTheDocument();
    expect(screen.getByText(/approve/i)).toBeInTheDocument();
    expect(screen.getByText(/reject/i)).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });
});
