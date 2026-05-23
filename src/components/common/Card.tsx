import { ReactNode } from "react";
import { Card as UiCard, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  muted,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <UiCard className={cn(muted && "bg-muted/50", className)}>
      <CardContent className="p-6">{children}</CardContent>
    </UiCard>
  );
}
