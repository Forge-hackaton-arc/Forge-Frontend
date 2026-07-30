import { RegisterAgentForm } from "@/components/agents/register-agent-form";
import { AgentDirectoryTable } from "@/components/agents/agent-directory-table";

export const metadata = { title: "Agents · Forge" };

export default function AgentsPage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]"
        aria-hidden
      />
      <div className="container grid gap-8 py-8 lg:grid-cols-[380px_1fr]">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Agents</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Portable identity via ERC-8004.</p>
          <RegisterAgentForm />
        </div>
        <AgentDirectoryTable />
      </div>
    </div>
  );
}
