import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataBoardSearchIcon } from "../../../components/ui/DataBoardSearchIcon";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { formatMoney } from "../../../lib/formatDisplay";
import type { AdminPricingRow } from "../adminPricingTypes";
import { AdminPricingEditorModal } from "./AdminPricingEditorModal";
import { useAdminPricingList } from "./useAdminPricingList";

function displayPrice(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatMoney(n);
}

export function AdminPricingPage() {
  const { rows, filtered, search, setSearch, loadRows, msg, err, savePricing, deletePricing } =
    useAdminPricingList();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminPricingRow | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

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

  function requestDelete(row: AdminPricingRow, closeEditorAfter = false) {
    confirmAction(
      {
        title: "Delete frame size",
        message: `Remove "${row.frameSize}" from the catalogue? This cannot be undone. Sizes used on existing orders cannot be deleted.`,
        confirmLabel: "Delete",
        variant: "danger",
      },
      async () => {
        const ok = await deletePricing(row.frameSize);
        if (ok && closeEditorAfter) closeModal();
      },
    );
  }

  return (
    <div className="data-board">
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Pricing</span>
      </nav>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        Set online and cash full prices per frame size (e.g. 12x18). Executives choose payment mode first, then frame size uses the matching catalogue price.
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
              <th>Online</th>
              <th>Cash</th>
              <th>Active</th>
              <th className="td-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.frameSize}>
                <td className="td-strong">{r.frameSize}</td>
                <td>{displayPrice(r.onlinePrice)}</td>
                <td>{displayPrice(r.cashPrice)}</td>
                <td>
                  {r.isActive ? (
                    <span className="pill pill--neutral">Yes</span>
                  ) : (
                    <span className="pill pill--neutral">No</span>
                  )}
                </td>
                <td className="td-actions">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => requestDelete(r)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={5}>
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
        onDelete={editingRow ? () => requestDelete(editingRow, true) : undefined}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
