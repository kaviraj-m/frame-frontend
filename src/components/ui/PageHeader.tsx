import { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div className="min-w-0 flex-1">
        {kicker ? (
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-primary">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
