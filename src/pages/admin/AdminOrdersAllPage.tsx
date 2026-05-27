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
  FRAMEWORKS_FILTERS,
  avatarColorIndex,
  customerKey,
  initials,
  isActiveUiStatus,
  mapOrderStatus,
  orderRemark,
  type FrameworksUiStatus,
} from "./frameworksOrdersUtils";

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
    <aside className="w-full shrink-0 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-sm xl:w-[300px] xl:max-h-[min(65vh,880px)] xl:sticky xl:top-4">
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
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const filteredOrders = useMemo(() => {
    let data = sortedOrders;
    if (activeFilter !== "all") {
      data = data.filter((o) => mapOrderStatus(o.status) === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((o) => {
        const remark = orderRemark(o).toLowerCase();
        const rawStatus = (o.status ?? "").toLowerCase();
        const uiLabel = mapOrderStatus(o.status ?? "").toLowerCase();
        return (
          o.orderId.toLowerCase().includes(q) ||
          o.queryId.toLowerCase().includes(q) ||
          (o.customerUsername ?? "").toLowerCase().includes(q) ||
          (o.customerPhoneNumber ?? "").includes(q) ||
          (o.customerEmail ?? "").toLowerCase().includes(q) ||
          rawStatus.includes(q) ||
          uiLabel.includes(q) ||
          remark.includes(q)
        );
      });
    }
    return data;
  }, [sortedOrders, search, activeFilter]);

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

      <div className="flex min-w-0 flex-col gap-4 min-h-[min(65vh,880px)] xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
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
            {FRAMEWORKS_FILTERS.map((f) => (
              <Button
                key={f}
                type="button"
                variant={activeFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(f)}
              >
                {f === "all" ? "All" : f}
              </Button>
            ))}
            <div className="ml-auto flex flex-wrap gap-2 items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={filteredOrders.length === 0}
                onClick={() => exportOrdersToExcel(filteredOrders)}
              >
                Export Excel
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/admin/orders/patch">
                  <IconPlus />
                  New order
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-3 px-0.5">
            <OrderRowAgeLegend />
          </div>

          <div className="overflow-auto w-full">
            <Table>
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
                      No orders match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <p className="text-sm text-muted-foreground">
                Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
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
