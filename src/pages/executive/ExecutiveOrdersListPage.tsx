import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { OrderIdCell } from "@/components/orders/OrderIdCell";
import { OrderRowAgeLegend } from "@/components/orders/OrderRowAgeLegend";
import { orderRowAgeDataAttr, orderRowClassName } from "@/lib/orderCreatedAge";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { exportOrdersToExcel } from "@/lib/exportOrdersExcel";
import {
  countByStatusFilter,
  distinctFrameSizes,
  distinctPaymentModes,
  filterExecutiveOrders,
  hasActiveExecutiveFilters,
  isValidDateRange,
  sortOrdersNewestFirst,
  createdPresetToFilters,
  type CreatedDateRange,
  type CreatedFilterPreset,
  type ExecutiveStatusFilter,
} from "@/lib/executiveOrdersList";
import { formatMoney, formatShortDateTime } from "@/lib/formatDisplay";
import type { OrderListRow } from "@/lib/orderListTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { WHATSAPP_BTN_COMPACT } from "@/lib/whatsappButtonStyles";

const STATUS_FILTERS: { id: ExecutiveStatusFilter; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "open", label: "Open" },
  { id: "new", label: "New" },
  { id: "in_progress", label: "In progress" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const CREATED_FILTERS: { id: CreatedFilterPreset; label: string }[] = [
  { id: "all", label: "All dates" },
  { id: "today", label: "Today" },
  { id: "day2", label: "Yesterday" },
  { id: "day3", label: "Delayed" },
  { id: "old", label: "Overdue" },
  { id: "custom", label: "Custom range" },
];

const EMPTY_DATE_RANGE: CreatedDateRange = { from: "", to: "" };

const filterSelectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]";

export function ExecutiveOrdersListPage() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExecutiveStatusFilter>("all");
  const [createdPreset, setCreatedPreset] = useState<CreatedFilterPreset>("all");
  const [dateRange, setDateRange] = useState<CreatedDateRange>(EMPTY_DATE_RANGE);
  const [frameFilter, setFrameFilter] = useState("all");
  const [payModeFilter, setPayModeFilter] = useState("all");
  const [waBusyOrderId, setWaBusyOrderId] = useState<string | null>(null);

  async function openWhatsApp(orderId: string) {
    setError("");
    setWaBusyOrderId(orderId);
    try {
      const link = await api<{ redirectUrl: string }>(apiPaths.executiveOrderWhatsApp(orderId));
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusyOrderId(null);
    }
  }

  async function refresh() {
    setError("");
    try {
      const all = await api<OrderListRow[]>(apiPaths.orders);
      setOrders(sortOrdersNewestFirst(all));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const dateRangeInvalid = useMemo(
    () =>
      createdPreset === "custom" &&
      !isValidDateRange(dateRange) &&
      !!(dateRange.from.trim() || dateRange.to.trim()),
    [createdPreset, dateRange],
  );

  const { ageFilter, dateRange: effectiveDateRange } = useMemo(
    () => createdPresetToFilters(createdPreset, dateRange),
    [createdPreset, dateRange],
  );

  const filtered = useMemo(() => {
    if (dateRangeInvalid) return [];
    return filterExecutiveOrders(orders, {
      statusFilter,
      ageFilter,
      dateRange: effectiveDateRange,
      frameFilter,
      payModeFilter,
      search,
    });
  }, [
    orders,
    statusFilter,
    ageFilter,
    effectiveDateRange,
    frameFilter,
    payModeFilter,
    search,
    dateRangeInvalid,
  ]);

  const statusCounts = useMemo(() => countByStatusFilter(orders), [orders]);
  const frameSizes = useMemo(() => distinctFrameSizes(orders), [orders]);
  const paymentModes = useMemo(() => distinctPaymentModes(orders), [orders]);

  const filtersActive = hasActiveExecutiveFilters({
    statusFilter,
    createdPreset,
    dateRange,
    frameFilter,
    payModeFilter,
    search,
  });

  function onCreatedPresetChange(value: CreatedFilterPreset) {
    setCreatedPreset(value);
    if (value !== "custom") setDateRange(EMPTY_DATE_RANGE);
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customer, phone…"
            aria-label="Search orders"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() => exportOrdersToExcel(filtered)}
          >
            Export Excel
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Status</span>
          <select
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExecutiveStatusFilter)}
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({statusCounts[f.id]})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Created (IST)</span>
          <select
            className={filterSelectClass}
            value={createdPreset}
            onChange={(e) => onCreatedPresetChange(e.target.value as CreatedFilterPreset)}
            aria-label="Filter by created date"
          >
            {CREATED_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {createdPreset === "custom" ? (
          <>
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                className="w-auto min-w-[140px] [color-scheme:dark]"
                value={dateRange.from}
                onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                aria-label="Created from date"
              />
            </label>
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                className="w-auto min-w-[140px] [color-scheme:dark]"
                value={dateRange.to}
                onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                aria-label="Created to date"
              />
            </label>
          </>
        ) : null}
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Frame</span>
          <select
            className={filterSelectClass}
            value={frameFilter}
            onChange={(e) => setFrameFilter(e.target.value)}
            aria-label="Filter by frame size"
          >
            <option value="all">All frames</option>
            {frameSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Pay mode</span>
          <select
            className={filterSelectClass}
            value={payModeFilter}
            onChange={(e) => setPayModeFilter(e.target.value)}
            aria-label="Filter by pay mode"
          >
            <option value="all">All modes</option>
            {paymentModes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dateRangeInvalid && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>&quot;From&quot; date must be on or before &quot;To&quot; date.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-3 px-0.5">
        <OrderRowAgeLegend />
      </div>
      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Frame</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Advance</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Pay mode</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {filtered.map((o) => (
              <TableRow
                key={o.orderId}
                className={cn(orderRowClassName(o.createdAt, o.status))}
                data-order-age={orderRowAgeDataAttr(o.createdAt, o.status)}
              >
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col items-start gap-0.5">
                    {o.status?.toUpperCase() === "ORDER_CONFIRMED" ? (
                      <Button
                        type="button"
                        size="sm"
                        className={cn(WHATSAPP_BTN_COMPACT)}
                        disabled={
                          waBusyOrderId === o.orderId || !o.customerPhoneNumber?.trim()
                        }
                        title={
                          o.customerPhoneNumber?.trim()
                            ? `Open WhatsApp for order ${o.orderId}`
                            : "Customer phone required for WhatsApp"
                        }
                        onClick={() => void openWhatsApp(o.orderId)}
                      >
                        {waBusyOrderId === o.orderId ? "Opening…" : "WhatsApp"}
                      </Button>
                    ) : null}
                    <OrderIdCell orderId={o.orderId} />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{o.queryId}</TableCell>
                <TableCell className="font-semibold">{o.customerUsername?.trim() ? o.customerUsername : "—"}</TableCell>
                <TableCell>{o.customerPhoneNumber?.trim() ? o.customerPhoneNumber : "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate" title={o.customerEmail || undefined}>
                  {o.customerEmail?.trim() ? o.customerEmail : "—"}
                </TableCell>
                <TableCell>{o.frameSize ?? "—"}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell>{formatMoney(o.advancePayment)}</TableCell>
                <TableCell>{formatMoney(o.balanceAmount)}</TableCell>
                <TableCell>{o.paymentMode ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(o.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(o.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/executive/orders/${encodeURIComponent(o.orderId)}/assets`}>
                      Photos
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  {orders.length === 0
                    ? "No orders yet. Confirm an order from Queries."
                    : dateRangeInvalid
                      ? "Fix the date range to see matching orders."
                      : "No rows match your search or filters."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          Showing <strong>{filtered.length}</strong> order{filtered.length === 1 ? "" : "s"}
          {filtersActive ? ` (of ${orders.length})` : ""}
        </p>
      </div>
      <p className="text-sm text-muted-foreground mt-3.5">
        Nothing here? Start from <Link to="/executive/queries" className="text-primary font-semibold hover:underline">Queries</Link> and use{" "}
        <strong>Confirm order</strong> on a row. Export Excel includes the filtered list only.
      </p>
    </div>
  );
}
