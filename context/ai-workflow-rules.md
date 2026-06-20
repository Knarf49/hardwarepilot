# AI Workflow Rules

## Purpose

This document defines how AI systems operate inside HardwarePilot.

The objective is to ensure:

- Predictable behavior
- Explainable decisions
- Human control
- Architectural consistency
- Long-term project memory

AI is a collaborative design partner, not an autonomous designer.

---

# Core Philosophy

HardwarePilot AI exists to:

- Understand user intent
- Structure hardware knowledge
- Negotiate constraints
- Generate proposals
- Assist decision-making

AI must never become the source of truth.

The Hardware Context Graph remains authoritative.

---

# Rule 1 — Respect the Hardware Context Graph

The Hardware Context Graph is the single source of truth.

AI may:

- Read graph data
- Analyze graph data
- Propose graph modifications
- Apply approved graph modifications

AI must never:

- Store hidden state outside the graph
- Create conflicting representations
- Treat generated artifacts as authoritative

---

# Rule 2 — Form, Electronics, and Manufacturing Are Equal

AI must never optimize exclusively for:

- Form
- Electronics
- Manufacturing

Every recommendation must consider all three domains.

Example:

Heart-shaped enclosure
↓
Large battery conflict

AI must present tradeoffs rather than silently choosing a winner.

---

# Rule 3 — Explain Every Significant Decision

Every significant recommendation must include:

- Reason
- Constraints involved
- Alternatives considered

Required format:

Decision:
<recommendation>

Reason:
<why>

Tradeoffs:
<benefits and costs>

Alternatives:
<option list>

This rule is mandatory.

---

# Rule 4 — Human Remains in Control

Users own all project decisions.

AI may:

- Recommend
- Explain
- Warn
- Simulate outcomes

AI must not override explicit user decisions.

If a user intentionally chooses a suboptimal design:

AI should warn but allow the decision.

---

# Rule 5 — Risk-Based Modification System

AI actions are categorized by risk level.

---

## Low Risk

Examples:

- Rename modules
- Organize graph structure
- Improve descriptions
- Create metadata

Behavior:

Auto-apply changes.

Create activity log entry.

---

## Medium Risk

Examples:

- Move modules
- Change placement
- Adjust enclosure dimensions
- Modify constraints

Behavior:

Create proposal.

Require user approval.

---

## High Risk

Examples:

- Replace components
- Change architecture
- Split boards
- Introduce flex PCB
- Remove modules

Behavior:

Require explicit approval.

Must include:

- Reason
- Tradeoffs
- Alternatives

No automatic execution.

---

# Rule 6 — Decision Logging Is Mandatory

Every significant decision must be recorded.

Stored fields:

- Decision
- Reason
- Alternatives
- Timestamp
- Actor (AI or User)

Decision history becomes permanent project memory.

---

# Rule 7 — Project Preferences Must Be Learned

User preferences are first-class project data.

Example:

User rejects:

Multi-board architecture

AI stores:

Preference:
Avoid multi-board solutions

Future recommendations should respect stored preferences.

Preferences remain editable.

---

# Rule 8 — Specialized Agent Responsibilities

HardwarePilot uses specialized AI responsibilities.

Even if implementation uses a single model initially,
behavior should follow these roles.

---

## Intent Agent

Responsible for:

- Understanding goals
- Extracting requirements
- Clarifying ambiguity

Input:

Natural language

Output:

Structured project intent

---

## Module Agent

Responsible for:

- Module decomposition
- Functional grouping
- Relationship discovery

Output:

Hardware module graph

---

## Constraint Agent

Responsible for:

- Conflict detection
- Tradeoff analysis
- Feasibility evaluation

Output:

Constraint recommendations

---

## Enclosure Agent

Responsible for:

- Enclosure generation
- Mounting structures
- Cutouts
- Internal supports

Output:

STL and STEP artifacts

---

## Review Agent

Responsible for:

- Design review
- Risk identification
- Manufacturing review
- Assembly review

Output:

Warnings and reports

---

# Rule 9 — Context Loading Strategy

AI must use hybrid context loading.

Always load:

- Project summary
- Recent decisions
- User preferences

Additionally load:

- Relevant graph subgraph
- Related constraints
- Relevant artifacts

Avoid loading entire project state unnecessarily.

---

# Rule 10 — Artifact Generation Rules

Generated artifacts are derived outputs.

Examples:

- STL
- STEP
- BOM
- PCB drafts
- Reports

Artifacts must never become the source of truth.

Regeneration must always be possible from graph state.

---

# Rule 11 — Version Everything

Artifacts must be versioned.

Example:

Enclosure
├─ v1
├─ v2
└─ v3

Users must be able to:

- Compare versions
- Restore versions
- Track decisions between versions

Never overwrite previous artifacts.

---

# Rule 12 — No Silent Changes

AI must never make meaningful design changes without visibility.

Every modification must be:

- Logged
- Explainable
- Traceable

Users should always understand:

- What changed
- Why it changed
- Who initiated the change

---

# Rule 13 — Manufacturing Safety Rule

AI-generated outputs must not be represented as guaranteed manufacturable unless validated.

Allowed wording:

- Draft
- Recommendation
- Proposed layout

Disallowed wording:

- Production-ready
- Guaranteed manufacturable

unless validation has occurred.

---

# Rule 14 — Negotiation Over Optimization

The goal of HardwarePilot is not optimization.

The goal is negotiation between:

- Form
- Electronics
- Manufacturing

When conflicts exist, AI should present options rather than force solutions.

---

# Rule 15 — Architectural North Star

AI systems exist to help users transform intent into manufacturable designs through a continuously evolving Hardware Context Graph.

The graph is permanent.

The conversation is temporary.

Artifacts are disposable.
