import { useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../../components/ui/DataBoardSearchIcon";
import { formatMoney } from "../../../lib/formatDisplay";
import type { AdminPricingRow } from "../adminPricingTypes";
import { AdminPricingEditorModal } from "./AdminPricingEditorModal";
import { useAdminPricingList } from "./useAdminPricingList";

export function AdminPricingPage() {
  const { rows, filtered, search, setSearch, loadRows, msg, err, savePricing } =
    useAdminPricingList();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminPricingRow | null>(null);

  function openCreate() {
    setEditingRow(null);
    setModalOpen(true);
  }

  function openEdit(row: AdminPricingRow) {
    setEditingRow(row);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRow(null);
  }

  return (
    <div className="data-board">
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Pricing</span>
      </nav>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        List price per size key (e.g. 12x18). Executives pick from active sizes when confirming an order.
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
            placeholder="Search frame size…"
            aria-label="Search pricing"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            New frame size
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadRows}>
            Refresh list
          </button>
        </div>
      </div>
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}

      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Frame size</th>
              <th>Price</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.frameSize}
                className="is-clickable-row"
                onClick={() => openEdit(r)}
              >
                <td className="td-strong">{r.frameSize}</td>
                <td>{formatMoney(r.price)}</td>
                <td>
                  {r.isActive ? (
                    <span className="pill pill--neutral">Yes</span>
                  ) : (
                    <span className="pill pill--neutral">No</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={3}>
                  {rows.length === 0
                    ? "No frame sizes yet. Use “New frame size” to add one."
                    : "No rows match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> frame size{filtered.length === 1 ? "" : "s"}
            {search.trim() ? ` (of ${rows.length})` : ""}
          </p>
        </div>
      </div>

      <AdminPricingEditorModal
        open={modalOpen}
        editingRow={editingRow}
        onClose={closeModal}
        onSave={savePricing}
      />
    </div>
  );
}
