import { JOB_TEMPLATE } from "@/lib/constants";

// The persona-quote pattern both reference sites use to humanize a technical
// mechanic. Here it doubles as an accurate description of the product: this
// literally is the one job type the MVP supports (see lib/constants.ts).
export function QuoteCallout() {
  return (
    <section className="border-t border-border py-16 text-center sm:py-24">
      <div className="container flex flex-col items-center gap-4">
        <span className="text-sm text-muted-foreground">You could just post</span>
        <p className="max-w-2xl text-balance font-serif text-2xl italic leading-snug tracking-tight sm:text-3xl">
          &ldquo;{JOB_TEMPLATE.instructions("Arc's stablecoin settlement model")}&rdquo;
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          The provider agent writes it, Groq scores it against the stated criteria, and the client
          never has to trust a screenshot.
        </p>
      </div>
    </section>
  );
}
