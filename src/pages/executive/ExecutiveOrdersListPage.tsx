import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { OrderIdCell } from "../../components/orders/OrderIdCell";
import { OrderRowAgeLegend } from "../../components/orders/OrderRowAgeLegend";
import { orderRowAgeDataAttr, orderRowClassName } from "../../lib/orderCreatedAge";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { exportOrdersToExcel } from "../../lib/exportOrdersExcel";
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
} from "../../lib/executiveOrdersList";
import { formatMoney, formatShortDateTime } from "../../lib/formatDisplay";
import type { OrderListRow } from "../../lib/orderListTypes";

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
  { id: "day3", label: "2 days" },
  { id: "old", label: "3+ days" },
  { id: "custom", label: "Custom range" },
];

const EMPTY_DATE_RANGE: CreatedDateRange = { from: "", to: "" };

export function ExecutiveOrdersListPage() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExecutiveStatusFilter>("all");
  const [createdPreset, setCreatedPreset] = useState<CreatedFilterPreset>("all");
  const [dateRange, setDateRange] = useState<CreatedDateRange>(EMPTY_DATE_RANGE);
  const [frameFilter, setFrameFilter] = useState("all");
  const [payModeFilter, setPayModeFilter] = useState("all");

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
    <div className="data-board">
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customer, phone…"
            aria-label="Search orders"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={filtered.length === 0}
            onClick={() => exportOrdersToExcel(filtered)}
          >
            Export Excel
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      <div className="data-board__filter-row">
        <label className="data-board__filter-field">
          <span className="data-board__filter-field-label">Status</span>
          <select
            className="data-board__filter-select"
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
        <label className="data-board__filter-field">
          <span className="data-board__filter-field-label">Created (IST)</span>
          <select
            className="data-board__filter-select"
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
            <label className="data-board__filter-field">
              <span className="data-board__filter-field-label">From</span>
              <input
                type="date"
                className="data-board__filter-select data-board__filter-date"
                value={dateRange.from}
                onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                aria-label="Created from date"
              />
            </label>
            <label className="data-board__filter-field">
              <span className="data-board__filter-field-label">To</span>
              <input
                type="date"
                className="data-board__filter-select data-board__filter-date"
                value={dateRange.to}
                onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                aria-label="Created to date"
              />
            </label>
          </>
        ) : null}
        <label className="data-board__filter-field">
          <span className="data-board__filter-field-label">Frame</span>
          <select
            className="data-board__filter-select"
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
        <label className="data-board__filter-field">
          <span className="data-board__filter-field-label">Pay mode</span>
          <select
            className="data-board__filter-select"
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
        <div className="flash flash--error" role="alert">
          &quot;From&quot; date must be on or before &quot;To&quot; date.
        </div>
      )}
      {error && (
        <div className="flash flash--error" role="alert">
          {error}
        </div>
      )}
      <div className="mb-3 px-0.5">
        <OrderRowAgeLegend />
      </div>
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Query</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Frame</th>
              <th>Status</th>
              <th>Advance</th>
              <th>Balance</th>
              <th>Pay mode</th>
              <th>Created</th>
              <th>Updated</th>
              <th className="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.orderId}
                className={orderRowClassName(o.createdAt, o.status)}
                data-order-age={orderRowAgeDataAttr(o.createdAt, o.status)}
              >
                <td className="td-mono">
                  <OrderIdCell orderId={o.orderId} />
                </td>
                <td className="td-mono td-muted-id">{o.queryId}</td>
                <td className="td-strong">{o.customerUsername?.trim() ? o.customerUsername : "—"}</td>
                <td>{o.customerPhoneNumber?.trim() ? o.customerPhoneNumber : "—"}</td>
                <td className="remark-clip" title={o.customerEmail || undefined}>
                  {o.customerEmail?.trim() ? o.customerEmail : "—"}
                </td>
                <td>{o.frameSize ?? "—"}</td>
                <td>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td>{formatMoney(o.advancePayment)}</td>
                <td>{formatMoney(o.balanceAmount)}</td>
                <td>{o.paymentMode ?? "—"}</td>
                <td className="date-cell">{formatShortDateTime(o.createdAt)}</td>
                <td className="date-cell">{formatShortDateTime(o.updatedAt)}</td>
                <td className="td-actions">
                  <div className="inline-actions">
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/executive/orders/${encodeURIComponent(o.orderId)}/assets`}
                    >
                      Photos
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={13}>
                  {orders.length === 0
                    ? "No orders yet. Confirm an order from Queries."
                    : dateRangeInvalid
                      ? "Fix the date range to see matching orders."
                      : "No rows match your search or filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> order{filtered.length === 1 ? "" : "s"}
            {filtersActive ? ` (of ${orders.length})` : ""}
          </p>
        </div>
      </div>
      <p className="data-board__footer-note">
        Nothing here? Start from <Link to="/executive/queries">Queries</Link> and use{" "}
        <strong>Confirm order</strong> on a row. Export Excel includes the filtered list only.
      </p>
    </div>
  );
}
