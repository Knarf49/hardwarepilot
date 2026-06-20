"use client";

import { AlertTriangle, Check, Eye, Info, Ruler, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Issue {
  severity: "error" | "warning" | "info";
  description: string;
  module?: string;
  moduleA?: string;
  moduleB?: string;
  gap?: number;
  category?: string;
  recommendation: string;
}

interface ReviewResult {
  accessibilityIssues: Issue[];
  clearanceProblems: Issue[];
  manufacturingConcerns: Issue[];
  overallScore: "pass" | "pass_with_warnings" | "fail";
  summary: string;
}

const severityIcons = {
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const severityColors = {
  error: "text-red-400 border-red-500/30 bg-red-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  info: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

const scoreLabels = {
  pass: "Pass",
  pass_with_warnings: "Pass with Warnings",
  fail: "Fail",
};

const scoreColors = {
  pass: "bg-green-500/20 text-green-400 border-green-500/30",
  pass_with_warnings: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  fail: "bg-red-500/20 text-red-400 border-red-500/30",
};

const scoreIcons = {
  pass: Check,
  pass_with_warnings: AlertTriangle,
  fail: X,
};

function IssueBlock({ issue, prefix }: { issue: Issue; prefix?: string }) {
  const Icon = severityIcons[issue.severity];

  return (
    <div className={cn("p-3 rounded-lg border text-sm", severityColors[issue.severity])}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">
            {prefix && <span className="text-neutral-500 text-xs mr-1">{prefix}</span>}
            {issue.description}
          </p>
          {issue.module && <p className="text-xs opacity-70 mt-0.5">Module: {issue.module}</p>}
          {issue.moduleA && issue.moduleB && (
            <p className="text-xs opacity-70 mt-0.5">
              Between: {issue.moduleA} ↔ {issue.moduleB}
              {issue.gap !== undefined && ` (gap: ${issue.gap}mm)`}
            </p>
          )}
          {issue.category && (
            <p className="text-xs opacity-70 mt-0.5">Category: {issue.category}</p>
          )}
          <p className="text-xs mt-1 opacity-80">→ {issue.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

export function ReviewReport({ result }: { result: ReviewResult }) {
  const ScoreIcon = scoreIcons[result.overallScore];
  const totalIssues =
    result.accessibilityIssues.length +
    result.clearanceProblems.length +
    result.manufacturingConcerns.length;

  return (
    <div className="space-y-6">
      <div className={cn("rounded-xl border p-6", scoreColors[result.overallScore])}>
        <div className="flex items-center gap-3">
          <ScoreIcon className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">{scoreLabels[result.overallScore]}</h2>
            <p className="text-sm mt-1 opacity-80">{result.summary}</p>
          </div>
          {totalIssues > 0 && (
            <span className="ml-auto text-sm opacity-80">
              {totalIssues} issue{totalIssues > 1 ? "s" : ""} found
            </span>
          )}
        </div>
      </div>

      {result.accessibilityIssues.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="text-sm font-medium text-neutral-200">
              Accessibility ({result.accessibilityIssues.length})
            </h3>
          </div>
          <div className="space-y-2">
            {result.accessibilityIssues.map((issue, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: generated data, stable order
              <IssueBlock key={i} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {result.clearanceProblems.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="text-sm font-medium text-neutral-200">
              Clearance ({result.clearanceProblems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {result.clearanceProblems.map((issue, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: generated data, stable order
              <IssueBlock key={i} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {result.manufacturingConcerns.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="text-sm font-medium text-neutral-200">
              Manufacturing ({result.manufacturingConcerns.length})
            </h3>
          </div>
          <div className="space-y-2">
            {result.manufacturingConcerns.map((issue, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: generated data, stable order
              <IssueBlock key={i} issue={issue} prefix={issue.category} />
            ))}
          </div>
        </div>
      )}

      {totalIssues === 0 && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
          <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">All checks passed</p>
          <p className="text-green-300/70 text-sm mt-1">
            No accessibility, clearance, or manufacturing issues detected.
          </p>
        </div>
      )}
    </div>
  );
}
