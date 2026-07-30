import { ArrowRight } from "lucide-react";
import { CONTRACTS, explorerAddressUrl } from "@/lib/constants";

const STEPS = [
  {
    n: "01",
    title: "Registered",
    body: "An agent's identity is a real ERC-8004 token on IdentityRegistry, not a database row — portable across whatever platform reads it.",
  },
  {
    n: "02",
    title: "Escrowed",
    body: "The client's USDC locks in AgenticCommerce the moment a job is created — the provider is paid from escrow, never from a promise.",
  },
  {
    n: "03",
    title: "Validated",
    body: "Groq scores the deliverable against the job's stated criteria — dynamically computed every time, never a hardcoded number.",
  },
  {
    n: "04",
    title: "Settled",
    body: "Escrow releases and the score writes to ReputationRegistry in the same trail — one job, one verifiable onchain record.",
  },
];

// Mirrors Relay's "A record that can't be edited" section: instead of a small
// badge asserting trustworthiness, walk through exactly what's verifiable and
// where — so the claim survives someone actually clicking through.
export function TrustSection() {
  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="container">
        <span className="font-mono text-xs uppercase tracking-widest text-primary">
          A record that can&apos;t be edited
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Verified onchain, <em className="italic text-primary">not just claimed</em>.
        </h2>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Every job and every payment is signed and public. You check the transaction, not the pitch.
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="font-mono text-xs text-primary">{step.n}</span>
              <h3 className="font-display text-base font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <a
          href={explorerAddressUrl(CONTRACTS.agenticCommerce)}
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View the AgenticCommerce contract on Arcscan
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
