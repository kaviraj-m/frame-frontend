import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mapOrderStatus, type FrameworksUiStatus } from "@/lib/orderStatusUi";

function variantFor(status: FrameworksUiStatus): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (status === "New") return "secondary";
  if (status === "In Progress") return "warning";
  if (status === "Ready") return "success";
  if (status === "Delivered") return "default";
  return "destructive";
}

type Props = {
  status: string;
  small?: boolean;
};

export function OrderStatusBadge({ status, small }: Props) {
  const ui = mapOrderStatus(status);
  const label = (status ?? "").trim() || "—";
  return (
    <Badge
      variant={variantFor(ui)}
      className={cn("status-pill", small && "text-[0.65rem] px-1.5 py-0")}
      title={ui !== label ? `${label} (${ui})` : label}
    >
      {label}
    </Badge>
  );
}
