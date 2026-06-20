import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog";
import { WorkspaceCard } from "@/components/workspaces/WorkspaceCard";
import { getWorkspaces } from "@/lib/services/workspace";

export const dynamic = "force-dynamic";

export default async function WorkspaceListPage() {
  const workspaces = await getWorkspaces();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-neutral-400 mt-1">Select a workspace or create a new one</p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-lg">No workspaces yet</p>
          <p className="text-neutral-600 mt-1">Create your first workspace to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
