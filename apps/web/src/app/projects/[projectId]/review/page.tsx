import { ClipboardCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProject } from "@/lib/services/project";
import { runReview } from "@/lib/review-engine";
import { ReviewReport } from "@/components/review/ReviewReport";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) return null;

  let reviewResult: Awaited<ReturnType<typeof runReview>> | null = null;
  let runError: string | null = null;

  try {
    reviewResult = await runReview(projectId);
  } catch (e) {
    runError = e instanceof Error ? e.message : "Review failed";
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/projects/${projectId}`}
        className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
      >
        Back to project
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-[#7C5CFC]" />
          Design Review — {project.name}
        </h1>
        <p className="text-neutral-400 mt-1 text-sm">
          AI-powered accessibility, clearance, and manufacturing review
        </p>
      </div>

      <div className="mt-6">
        {runError ? (
          <div className="p-4 rounded-lg border border-red-900/50 bg-red-950/30">
            <p className="text-red-400 text-sm font-medium">Review failed</p>
            <p className="text-red-300/70 text-sm mt-1">{runError}</p>
          </div>
        ) : !reviewResult ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#7C5CFC] animate-spin" />
            <span className="ml-3 text-neutral-400 text-sm">Running review...</span>
          </div>
        ) : (
          <>
            {reviewResult.wordingWarnings.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-amber-900/50 bg-amber-950/30">
                {reviewResult.wordingWarnings.map((w, i) => (
                  <p key={i} className="text-amber-400 text-xs">
                    * {w}
                  </p>
                ))}
              </div>
            )}
            <ReviewReport result={reviewResult.result} />
          </>
        )}
      </div>
    </div>
  );
}
