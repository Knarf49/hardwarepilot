"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createConstraint, deleteConstraint } from "@/actions/constraint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConstraintData {
  id: string;
  domain: string;
  rule: string;
  priority: string;
  expression: unknown;
  createdAt: Date;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#7C5CFC] hover:bg-[#6B4FE0] gap-2">
      <Plus className="w-4 h-4" />
      {pending ? "Adding..." : "Add Constraint"}
    </Button>
  );
}

export function ConstraintPanel({
  projectId,
  constraints,
}: {
  projectId: string;
  constraints: ConstraintData[];
}) {
  const [domain, setDomain] = useState("mechanical");
  const [, createAction] = useActionState(createConstraint, null);
  const [, deleteAction] = useActionState(deleteConstraint, null);

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900"
      >
        <h3 className="text-sm font-medium text-neutral-300">Add Constraint</h3>
        <input type="hidden" name="projectId" value={projectId} />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="c-domain">Domain</Label>
            <select
              id="c-domain"
              name="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
            >
              <option value="mechanical">Mechanical</option>
              <option value="electrical">Electrical</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="assembly">Assembly</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-priority">Priority</Label>
            <select
              id="c-priority"
              name="priority"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100"
            >
              <option value="must">Must</option>
              <option value="should">Should</option>
              <option value="may">May</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="c-rule">Rule</Label>
          <Input
            id="c-rule"
            name="rule"
            placeholder="Battery must fit within enclosure"
            required
            className="bg-neutral-800 border-neutral-700"
          />
        </div>
        <SubmitButton />
      </form>

      <div>
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">
          Constraints ({constraints.length})
        </h3>
        {constraints.length === 0 ? (
          <p className="text-neutral-600 text-sm">No constraints defined yet.</p>
        ) : (
          <div className="space-y-2">
            {constraints.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900 group hover:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium uppercase px-2 py-0.5 rounded ${
                      c.domain === "electrical"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : c.domain === "mechanical"
                          ? "bg-blue-500/10 text-blue-400"
                          : c.domain === "manufacturing"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {c.domain}
                  </span>
                  <div>
                    <span className="text-sm text-neutral-200">{c.rule}</span>
                    <span className="ml-2 text-xs text-neutral-500 capitalize">{c.priority}</span>
                  </div>
                </div>
                <form
                  action={deleteAction}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <input type="hidden" name="constraintId" value={c.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-neutral-600 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
