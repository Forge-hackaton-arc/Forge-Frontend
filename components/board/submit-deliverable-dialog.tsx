"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitDeliverable } from "@/lib/api";
import type { SubmitDeliverableResponse } from "@/lib/types";

export function SubmitDeliverableDialog({
  jobId,
  onSubmitted,
}: {
  jobId: string;
  onSubmitted: (response: SubmitDeliverableResponse, isMock: boolean) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data, source } = await submitDeliverable(jobId, { deliverableText: text.trim() });
      onSubmitted(data, source === "mock");
      toast[source === "mock" ? "message" : "success"](
        source === "mock" ? "Deliverable recorded (simulated)" : "Deliverable submitted onchain"
      );
      setOpen(false);
      setText("");
    } catch (err) {
      toast.error("Submission failed", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-full">Submit deliverable</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Submit deliverable</DialogTitle>
            <DialogDescription>
              Paste the ~200-word summary with 3 cited facts. Groq scores this against the job&apos;s stated
              criteria in the next step.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deliverable">Deliverable text</Label>
            <Textarea
              id="deliverable"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write or paste the summary here…"
              required
            />
            <p className="text-right text-[11px] text-muted-foreground">{wordCount} words</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !text.trim()}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
