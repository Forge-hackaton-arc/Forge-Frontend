import { RegisterAgentForm } from "@/components/agents/register-agent-form";
import { AgentDirectoryTable } from "@/components/agents/agent-directory-table";

export const metadata = { title: "Agents · Forge" };

export default function AgentsPage() {
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Portable identity via ERC-8004.</p>
        <RegisterAgentForm />
      </div>
      <AgentDirectoryTable />
    </div>
  );
}
