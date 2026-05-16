import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { formatShortDate, formatTableDateTime } from "../../lib/formatDisplay";
import type { AdminOrderRow } from "./adminOrderTypes";
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
    <aside className="data-board__panel">
      <div className="data-board__panel-head">
        <button type="button" className="data-board__panel-close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
        <div className="data-board__panel-avatar" style={{ background: AVATAR_COLORS[idx] }}>
          {initials(displayName)}
        </div>
        <div className="data-board__panel-name">{displayName}</div>
        <div className="data-board__panel-sub">
          {order.queryId}
          {order.customerEmail?.trim() ? ` · ${order.customerEmail.trim()}` : ""}
        </div>
        <div className="data-board__panel-status">
          <span className="data-board__panel-status-dot" aria-hidden />
          {(order.status ?? "").trim() || "—"}
        </div>
      </div>
      <div className="data-board__panel-body">
        <div className="data-board__panel-stats">
          <div className="data-board__panel-stat">
            <div className="data-board__panel-stat-num">{userOrders.length}</div>
            <div className="data-board__panel-stat-label">Total orders</div>
          </div>
          <div className="data-board__panel-stat">
            <div className="data-board__panel-stat-num">{activeCount}</div>
            <div className="data-board__panel-stat-label">Active</div>
          </div>
        </div>
        <div>
          <div className="data-board__panel-section-title">Contact information</div>
          {contactRows.map(({ label, value, icon }) => (
            <div key={label} className="data-board__panel-contact">
              <div className="data-board__panel-contact-icon">{icon}</div>
              <div>
                <div className="data-board__panel-contact-label">{label}</div>
                <div className="data-board__panel-contact-value">{value}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="data-board__panel-section-title">Order history</div>
          {userOrders.map((o) => {
            const cr = formatTableDateTime(o.createdAt);
            const ur = formatTableDateTime(o.updatedAt);
            return (
              <div key={o.orderId} className="data-board__panel-history-card">
                <div className="data-board__panel-history-top">
                  <span className="data-board__panel-history-id">{o.orderId}</span>
                  <OrderStatusBadge status={o.status} small />
                </div>
                <div className="data-board__panel-history-remark">{orderRemark(o)}</div>
                <div className="data-board__panel-history-meta">
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

  return (
    <div className="data-board">
      {error ? (
        <div className="flash flash--error" style={{ marginBottom: 14 }} role="alert">
          {error}
        </div>
      ) : null}

      <div className="data-board__layout">
        <div className="data-board__main">
          <div className="data-board__toolbar">
            <div className="data-board__search-wrap">
              <span className="data-board__search-icon">
                <DataBoardSearchIcon />
              </span>
              <input
                className="data-board__search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, order ID, phone…"
                aria-label="Search orders"
              />
            </div>
            {FRAMEWORKS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`data-board__chip${activeFilter === f ? " is-active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
            <div className="data-board__toolbar-actions">
              <Link to="/admin/orders/patch" className="btn btn--primary btn--sm data-board__btn-ico">
                <IconPlus />
                New order
              </Link>
            </div>
          </div>

          <div className="table-wrap table-wrap--scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Query ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Remarks</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Status</th>
                  <th className="td-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((row) => {
                  const user = row.customerUsername?.trim() || "Customer";
                  const key = customerKey(row);
                  const cidx = avatarColorIndex(key || row.orderId);
                  const isSelected = selectedOrder?.orderId === row.orderId;
                  const cr = formatTableDateTime(row.createdAt);
                  const ur = formatTableDateTime(row.updatedAt);
                  const rem = orderRemark(row);
                  return (
                    <tr
                      key={row.orderId}
                      className={isSelected ? "is-selected" : undefined}
                      onClick={() => setSelectedOrder(isSelected ? null : row)}
                    >
                      <td>
                        <span className="td-order-id">{row.orderId}</span>
                      </td>
                      <td>
                        <span className="td-muted-id">{row.queryId}</span>
                      </td>
                      <td>
                        <div className="data-board__cust-row">
                          <div className="data-board__avatar" style={{ background: AVATAR_COLORS[cidx] }}>
                            {initials(user)}
                          </div>
                          <div>
                            <div className="data-board__cust-name">{user}</div>
                            <div className="data-board__cust-email">{row.customerEmail?.trim() || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>{row.customerPhoneNumber?.trim() || "—"}</td>
                      <td>
                        <span className="data-board__remark remark-clip" title={rem}>
                          {rem}
                        </span>
                      </td>
                      <td>
                        <div className="data-board__dt-stack">
                          <div className="data-board__dt-main">{cr.date}</div>
                          <div className="data-board__dt-sub">{cr.time}</div>
                        </div>
                      </td>
                      <td>
                        <div className="data-board__dt-stack">
                          <div className="data-board__dt-main">{ur.date}</div>
                          <div className="data-board__dt-sub">{ur.time}</div>
                        </div>
                      </td>
                      <td>
                        <OrderStatusBadge status={row.status} />
                      </td>
                      <td className="td-actions">
                        <div className="data-board__row-actions">
                          <button
                            type="button"
                            className="data-board__icon-btn"
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
                          </button>
                          <Link
                            to={`/admin/orders/patch?orderId=${encodeURIComponent(row.orderId)}`}
                            className="data-board__icon-btn"
                            title="Update order"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Update order"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={9}>No orders match your filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="table-footer">
              <p className="total-info">
                Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
              </p>
              <div className="data-board__pager">
                <button type="button" className="data-board__page-btn" disabled aria-hidden>
                  ‹
                </button>
                <button type="button" className="data-board__page-btn is-current">
                  1
                </button>
                <button type="button" className="data-board__page-btn" disabled aria-hidden>
                  ›
                </button>
              </div>
            </div>
          </div>

          <p className="data-board__footer-note">
            <Link to="/admin/orders/production">Production &amp; dispatch</Link>
            {" · "}
            <button type="button" className="data-board__text-btn" onClick={refresh}>
              Refresh data
            </button>
          </p>
        </div>

        {selectedOrder ? (
          <UserPanel order={selectedOrder} allOrders={sortedOrders} onClose={() => setSelectedOrder(null)} />
        ) : null}
      </div>
    </div>
  );
}
