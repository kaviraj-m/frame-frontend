import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderIdCell } from "@/components/orders/OrderIdCell";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { OrderRowAgeLegend } from "@/components/orders/OrderRowAgeLegend";
import { orderRowAgeDataAttr, orderRowClassName } from "@/lib/orderCreatedAge";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { exportOrdersToExcel } from "@/lib/exportOrdersExcel";
import { formatShortDate, formatTableDateTime } from "@/lib/formatDisplay";
import { AdminOrderDetailModal } from "@/components/admin/AdminOrderDetailModal";
import { formatOrderFrameLabel } from "@/lib/orderListTypes";
import type { AdminOrderRow } from "./adminOrderTypes";
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
import {
  AVATAR_COLORS,
  avatarColorIndex,
  customerKey,
  initials,
  isActiveUiStatus,
  mapOrderStatus,
  orderRemark,
  type FrameworksUiStatus,
} from "./frameworksOrdersUtils";
import { FilterMultiSelect } from "@/components/ui/FilterMultiSelect";
import {
  filterOrderListRows,
  hasActiveOrderListFilters,
  isValidDateRange,
  type CreatedDateRange,
} from "@/lib/executiveOrdersList";
import { ORDER_AGE_FILTER_OPTIONS, orderRowAgeTier } from "@/lib/orderCreatedAge";
import { orderStatusMultiSelectOptions } from "@/lib/orderStatusFilter";
import {
  FILTER_FIELD_LABEL,
  RESPONSIVE_DATE_INPUT,
  RESPONSIVE_SEARCH_WRAP,
  RESPONSIVE_TOOLBAR_ACTIONS,
} from "@/lib/responsive";

const EMPTY_DATE_RANGE: CreatedDateRange = { from: "", to: "" };

function IconPlus() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UserPanel({
  order,
  allOrders,
  onClose,
}: {
  order: AdminOrderRow;
  allOrders: AdminOrderRow[];
  onClose: () => void;
}) {
  const key = customerKey(order);
  const displayName = order.customerUsername?.trim() || "Customer";
  const idx = avatarColorIndex(key || order.orderId);
  const userOrders = useMemo(() => {
    return allOrders
      .filter((o) => customerKey(o) === key)
      .sort((a, b) => {
        const ta = new Date(a.updatedAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? 0).getTime();
        return tb - ta;
      });
  }, [allOrders, key]);
  const activeCount = userOrders.filter((o) => isActiveUiStatus(mapOrderStatus(o.status))).length;
  const oldest = userOrders.reduce<string | undefined>((acc, o) => {
    if (!o.createdAt) return acc;
    if (!acc || o.createdAt < acc) return o.createdAt;
    return acc;
  }, undefined);

  const contactRows = [
    {
      label: "Phone",
      value: order.customerPhoneNumber?.trim() || "—",
      icon: (
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.53 6.53l.96-.92a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
    },
    {
      label: "Email",
      value: order.customerEmail?.trim() || "—",
      icon: (
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      label: "Delivery address",
      value: order.addressDetails?.trim() || "—",
    },
    {
      label: "Pincode",
      value: order.pincode?.trim() || "—",
      icon: (
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      label: "Customer since",
      value: oldest ? formatShortDate(oldest) : "—",
      icon: (
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full shrink-0 rounded-lg border border-border bg-card shadow-sm xl:sticky xl:top-4 xl:w-[300px] xl:max-h-[min(65vh,880px)]">
      <div className="relative p-5 pb-4 border-b border-border text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-7 w-7"
          onClick={onClose}
          aria-label="Close panel"
        >
          ✕
        </Button>
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm"
          style={{ background: AVATAR_COLORS[idx] }}
        >
          {initials(displayName)}
        </div>
        <div className="font-semibold mt-3">{displayName}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {order.queryId}
          {order.customerEmail?.trim() ? ` · ${order.customerEmail.trim()}` : ""}
        </div>
        <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" aria-hidden />
          {(order.status ?? "").trim() || "—"}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-xl font-bold">{userOrders.length}</div>
            <div className="text-xs text-muted-foreground">Total orders</div>
          </div>
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-xl font-bold">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Contact information
          </div>
          {contactRows.map(({ label, value, icon }) => (
            <div key={label} className="flex gap-2.5 mb-3 text-sm">
              <div className="text-muted-foreground shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="whitespace-pre-wrap">{value}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Order history
          </div>
          {userOrders.map((o) => {
            const cr = formatTableDateTime(o.createdAt);
            const ur = formatTableDateTime(o.updatedAt);
            return (
              <div key={o.orderId} className="rounded-md border border-border p-3 mb-2 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs">{o.orderId}</span>
                  <OrderStatusBadge status={o.status} small />
                </div>
                <div className="text-muted-foreground text-xs mb-1">{orderRemark(o)}</div>
                <div className="text-[0.65rem] text-muted-foreground">
                  Created {cr.date}
                  {cr.time ? ` · ${cr.time}` : ""} · Updated {ur.date}
                  {ur.time ? ` · ${ur.time}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function AdminOrdersAllPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAgeTiers, setSelectedAgeTiers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<CreatedDateRange>(EMPTY_DATE_RANGE);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { confirmAction, dialogProps } = useConfirmDialog();

  const refresh = useCallback(async () => {
    setError("");
    try {
      const all = await api<AdminOrderRow[]>(apiPaths.orders);
      setOrders(all);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ta = new Date(a.updatedAt ?? 0).getTime();
      const tb = new Date(b.updatedAt ?? 0).getTime();
      return tb - ta;
    });
  }, [orders]);

  const dateRangeInvalid = useMemo(
    () =>
      !isValidDateRange(dateRange) &&
      !!(dateRange.from.trim() || dateRange.to.trim()),
    [dateRange],
  );

  const statusFilterOptions = useMemo(
    () => orderStatusMultiSelectOptions(sortedOrders),
    [sortedOrders],
  );

  const ageFilterOptions = useMemo(() => {
    const counts: Record<string, number> = {
      today: 0,
      day2: 0,
      day3: 0,
      old: 0,
    };
    for (const o of sortedOrders) {
      const tier = orderRowAgeTier(o.createdAt, o.status);
      if (tier && tier in counts) counts[tier]++;
    }
    return ORDER_AGE_FILTER_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: counts[opt.value],
    }));
  }, [sortedOrders]);

  const filteredOrders = useMemo(() => {
    if (dateRangeInvalid) return [];
    return filterOrderListRows(sortedOrders, {
      statuses: selectedStatuses,
      ageTiers: selectedAgeTiers,
      dateRange,
      search,
    });
  }, [
    sortedOrders,
    selectedStatuses,
    selectedAgeTiers,
    dateRange,
    search,
    dateRangeInvalid,
  ]);

  const filtersActive = hasActiveOrderListFilters({
    statuses: selectedStatuses,
    ageTiers: selectedAgeTiers,
    dateRange,
    search,
  });

  function clearAllFilters() {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedAgeTiers([]);
    setDateRange(EMPTY_DATE_RANGE);
  }

  function requestDeleteOrder(row: AdminOrderRow) {
    confirmAction(
      {
        title: "Delete order",
        message: `Permanently delete order ${row.orderId}? This removes the order, its files, and line items. This cannot be undone.`,
        confirmLabel: "Delete order",
        variant: "danger",
      },
      async () => {
        setError("");
        setDeletingId(row.orderId);
        try {
          await api(apiPaths.adminDeleteOrder(row.orderId), { method: "DELETE" });
          if (selectedOrder?.orderId === row.orderId) setSelectedOrder(null);
          if (detailOrderId === row.orderId) setDetailOrderId(null);
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setDeletingId(null);
        }
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      {error ? (
        <Alert variant="destructive" role="alert" className="mb-3.5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <div className={RESPONSIVE_SEARCH_WRAP}>
              <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
                <DataBoardSearchIcon />
              </span>
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, order ID, phone…"
                aria-label="Search orders"
              />
            </div>
            <div className={RESPONSIVE_TOOLBAR_ACTIONS}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={filteredOrders.length === 0 || exporting}
                onClick={async () => {
                  setExporting(true);
                  setError("");
                  try {
                    await exportOrdersToExcel(filteredOrders, { fetchContributors: true });
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {exporting ? "Exporting…" : "Export Excel"}
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/admin/orders/patch">
                  <IconPlus />
                  New order
                </Link>
              </Button>
            </div>
          </div>

          <section
            className="mb-4 rounded-lg border border-border/70 bg-muted/15 p-3 sm:p-4"
            aria-label="Order filters"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className={FILTER_FIELD_LABEL}>Filters</span>
              {filtersActive ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterMultiSelect
                label="Status"
                emptyLabel="All statuses"
                selectedSummary="statuses selected"
                options={statusFilterOptions}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                aria-label="Filter by status"
              />
              <FilterMultiSelect
                label="Age"
                emptyLabel="All ages"
                selectedSummary="ages selected"
                options={ageFilterOptions}
                selected={selectedAgeTiers}
                onChange={setSelectedAgeTiers}
                aria-label="Filter by order age row colour"
              />
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={FILTER_FIELD_LABEL}>Created from</span>
                <Input
                  type="date"
                  className={RESPONSIVE_DATE_INPUT}
                  value={dateRange.from}
                  onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  aria-label="Created from date"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={FILTER_FIELD_LABEL}>Created to</span>
                <Input
                  type="date"
                  className={RESPONSIVE_DATE_INPUT}
                  value={dateRange.to}
                  onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                  aria-label="Created to date"
                />
              </label>
            </div>
            <div className="mt-4 border-t border-border/60 pt-3">
              <OrderRowAgeLegend />
            </div>
          </section>

          {dateRangeInvalid ? (
            <Alert variant="destructive" role="alert" className="mb-3">
              <AlertDescription>
                &quot;From&quot; date must be on or before &quot;To&quot; date.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="w-full">
            <Table stickyFirstColumn>
              <TableHeaderBand>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Query ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Frame</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeaderBand>
              <TableBody>
                {filteredOrders.map((row) => {
                  const user = row.customerUsername?.trim() || "Customer";
                  const key = customerKey(row);
                  const cidx = avatarColorIndex(key || row.orderId);
                  const isSelected = selectedOrder?.orderId === row.orderId;
                  const cr = formatTableDateTime(row.createdAt);
                  const ur = formatTableDateTime(row.updatedAt);
                  const rem = orderRemark(row);
                  return (
                    <TableRow
                      key={row.orderId}
                      className={cn(
                        "cursor-pointer",
                        orderRowClassName(
                          row.createdAt,
                          row.status,
                          isSelected ? "is-selected" : undefined,
                        ),
                      )}
                      data-order-age={orderRowAgeDataAttr(row.createdAt, row.status)}
                      onClick={() => setSelectedOrder(isSelected ? null : row)}
                    >
                      <TableCell>
                        <OrderIdCell orderId={row.orderId} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{row.queryId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[0.72rem] shrink-0"
                            style={{ background: AVATAR_COLORS[cidx] }}
                          >
                            {initials(user)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{user}</div>
                            <div className="text-[0.68rem] text-muted-foreground truncate">
                              {row.customerEmail?.trim() || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.customerPhoneNumber?.trim() || "—"}</TableCell>
                      <TableCell>
                        <span
                          className="block max-w-[140px] truncate text-sm"
                          title={formatOrderFrameLabel(row)}
                        >
                          {formatOrderFrameLabel(row)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[220px] truncate text-sm text-muted-foreground" title={rem}>
                          {rem}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">{cr.date}</div>
                          <div className="text-xs text-muted-foreground/80">{cr.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">{ur.date}</div>
                          <div className="text-xs text-muted-foreground/80">{ur.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            title="View customer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(row);
                            }}
                            aria-label="View customer"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            title="Order details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailOrderId(row.orderId);
                            }}
                            aria-label="Order details"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            title="Update order"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/admin/orders/patch?orderId=${encodeURIComponent(row.orderId)}`}
                              aria-label="Update order"
                            >
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete order"
                            disabled={deletingId === row.orderId}
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDeleteOrder(row);
                            }}
                            aria-label="Delete order"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      {dateRangeInvalid
                        ? "Fix the date range to see matching orders."
                        : orders.length === 0
                          ? "No orders yet."
                          : "No orders match your filters."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <p className="text-sm text-muted-foreground">
                Showing <strong>{filteredOrders.length}</strong> order
                {filteredOrders.length === 1 ? "" : "s"}
                {filtersActive ? (
                  <>
                    {" "}
                    (of <strong>{orders.length}</strong>)
                  </>
                ) : null}
              </p>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled aria-hidden>
                  ‹
                </Button>
                <Button type="button" variant="default" size="icon" className="h-7 w-7">
                  1
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled aria-hidden>
                  ›
                </Button>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-3.5">
            <Link to="/admin/orders/production" className="text-primary font-semibold hover:underline">
              Production &amp; dispatch
            </Link>
            {" · "}
            <button
              type="button"
              className="text-primary font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
              onClick={refresh}
            >
              Refresh data
            </button>
          </p>
        </div>

        {selectedOrder ? (
          <UserPanel order={selectedOrder} allOrders={sortedOrders} onClose={() => setSelectedOrder(null)} />
        ) : null}
      </div>

      <AdminOrderDetailModal
        orderId={detailOrderId ?? ""}
        open={!!detailOrderId}
        onClose={() => setDetailOrderId(null)}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
