import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  // @ts-expect-error - Prisma 7 ESM adapter
});

const ws = await db.workspace.create({ data: { name: "Test Workspace" } });
console.log("Workspace:", ws.id);

const proj = await db.project.create({
  data: { name: "Test Project", workspaceId: ws.id },
});
console.log("Project:", proj.id);

await db.$disconnect();
