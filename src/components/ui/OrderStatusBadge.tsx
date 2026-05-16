import { mapOrderStatus, type FrameworksUiStatus } from "../../lib/orderStatusUi";

function modifierFor(status: FrameworksUiStatus): string {
  if (status === "New") return "new";
  if (status === "In Progress") return "progress";
  if (status === "Ready") return "ready";
  if (status === "Delivered") return "delivered";
  return "cancelled";
}

type Props = {
  /** Raw API order status, e.g. `IN_DESIGN`, `ORDER_CONFIRMED`. */
  status: string;
  small?: boolean;
};

export function OrderStatusBadge({ status, small }: Props) {
  const ui = mapOrderStatus(status);
  const mod = modifierFor(ui);
  const label = (status ?? "").trim() || "—";
  return (
    <span
      className={`status-pill status-pill--${mod}${small ? " status-pill--sm" : ""}`}
      title={ui !== label ? `${label} (${ui})` : label}
    >
      <span className="status-pill__dot" aria-hidden />
      <span className="status-pill__label">{label}</span>
    </span>
  );
}
