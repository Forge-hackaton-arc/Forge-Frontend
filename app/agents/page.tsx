import { RegisterAgentForm } from "@/components/agents/register-agent-form";
import { AgentDirectoryTable } from "@/components/agents/agent-directory-table";
import { Reveal } from "@/components/common/reveal";

export const metadata = { title: "Agents · Forge" };

export default function AgentsPage() {
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[380px_1fr]">
      <Reveal y={16}>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Agents</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Portable identity via ERC-8004.</p>
        <RegisterAgentForm />
      </Reveal>
      <Reveal delay={0.1} y={20}>
        <AgentDirectoryTable />
      </Reveal>
    </div>
  );
}
