import { create } from "zustand";

export type Decision = {
  id: string;
  projectId: string;
  actor: string;
  decision: string;
  reason: string;
  tradeoffs?: string | null;
  alternatives?: unknown;
  affectedNodeType?: string | null;
  affectedNodeId?: string | null;
  createdAt: Date;
};

export type Proposal = {
  id: string;
  projectId: string;
  agentType: string;
  riskTier: string;
  title: string;
  description: string;
  reason: string;
  tradeoffs?: string | null;
  alternatives?: unknown;
  affectedNodes?: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type DecisionState = {
  decisions: Decision[];
  proposals: Proposal[];
  addDecision: (d: Decision) => void;
  addProposal: (p: Proposal) => void;
  updateProposalStatus: (id: string, status: string) => void;
  clear: () => void;
};

export const useDecisionStore = create<DecisionState>((set) => ({
  decisions: [],
  proposals: [],
  addDecision: (d) => set((state) => ({ decisions: [...state.decisions, d] })),
  addProposal: (p) => set((state) => ({ proposals: [...state.proposals, p] })),
  updateProposalStatus: (id, status) =>
    set((state) => ({
      proposals: state.proposals.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
  clear: () => set({ decisions: [], proposals: [] }),
}));
