import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: ReactNode; to?: string };

export function BreadcrumbNav({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav className={cn("mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 ? <span className="opacity-45">/</span> : null}
          {item.to ? (
            <Link to={item.to} className="font-medium text-muted-foreground hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
