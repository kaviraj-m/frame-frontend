import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { isPostDesignApprovalStatus } from "../../lib/orderStatusGroups";
import type { AdminOrderRow } from "./adminOrderTypes";
import { AdminOrdersTable } from "./AdminOrdersTable";

export function AdminOrdersProductionPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const all = await api<AdminOrderRow[]>(apiPaths.orders);
      setOrders(all.filter((o) => isPostDesignApprovalStatus(o.status)));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.queryId.toLowerCase().includes(q) ||
        (o.customerUsername ?? "").toLowerCase().includes(q) ||
        (o.customerPhoneNumber ?? "").includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q) ||
        (o.status ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

  return (
    <div className="data-board">
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/admin/orders">Orders</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Production &amp; dispatch</span>
      </nav>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        Orders after design approval — print, courier, tracking, and payment completion.
      </p>
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search production queue…"
            aria-label="Search orders"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <AdminOrdersTable
        orders={filtered}
        emptyMessage="No orders in production yet. They appear here once status is DESIGN_APPROVED or later (print through completion)."
      />
      <p className="data-board__footer-note">
        <Link to="/admin/orders">← All orders</Link>
      </p>
    </div>
  );
}
