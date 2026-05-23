import { cn } from "@/lib/utils";

type StepState = "active" | "done" | "locked";

export function WorkflowStepper({
  steps,
  states,
  ariaLabel,
}: {
  steps: { id: string; label: string; num: number }[];
  states: Record<string, StepState>;
  ariaLabel: string;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label={ariaLabel}
    >
      {steps.map((step) => {
        const state = states[step.id] ?? "locked";
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
              state === "active" && "border-primary bg-primary/10 text-foreground",
              state === "done" && "border-[var(--ok)]/45 bg-[var(--ok)]/10 text-foreground",
              state === "locked" && "border-border bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                state === "active" && "bg-primary text-primary-foreground",
                state === "done" && "bg-[var(--ok)] text-[#0a1208]",
                state === "locked" && "bg-muted text-muted-foreground",
              )}
            >
              {step.num}
            </span>
            {step.label}
          </div>
        );
      })}
    </div>
  );
}
