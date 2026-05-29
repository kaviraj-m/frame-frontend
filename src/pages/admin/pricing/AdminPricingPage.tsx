import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { formatMoney } from "@/lib/formatDisplay";
import type { AdminPricingRow } from "../adminPricingTypes";
import { AdminPricingEditorModal } from "./AdminPricingEditorModal";
import { useAdminPricingList } from "./useAdminPricingList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { RESPONSIVE_SEARCH_WRAP, RESPONSIVE_TOOLBAR_ACTIONS } from "@/lib/responsive";

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
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <nav className="breadcrumb text-sm mb-3">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Pricing</span>
      </nav>
      <p className="text-sm text-muted-foreground mb-3">
        Set online and cash full prices per frame size (e.g. 12x18). Executives choose payment mode first, then frame size uses the matching catalogue price.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className={RESPONSIVE_SEARCH_WRAP}>
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search frame size…"
            aria-label="Search pricing"
          />
        </div>
        <div className={RESPONSIVE_TOOLBAR_ACTIONS}>
          <Button type="button" size="sm" onClick={openCreate}>
            New frame size
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={loadRows}>
            Refresh list
          </Button>
        </div>
      </div>
      {msg && (
        <Alert variant="success" role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        <Table stickyFirstColumn>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Frame size</TableHead>
              <TableHead>Online</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.frameSize}>
                <TableCell className="font-semibold">{r.frameSize}</TableCell>
                <TableCell>{displayPrice(r.onlinePrice)}</TableCell>
                <TableCell>{displayPrice(r.cashPrice)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.isActive ? "Yes" : "No"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => requestDelete(r)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {rows.length === 0
                    ? "No frame sizes yet. Use “New frame size” to add one."
                    : "No rows match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          Showing <strong>{filtered.length}</strong> frame size{filtered.length === 1 ? "" : "s"}
          {search.trim() ? ` (of ${rows.length})` : ""}
        </p>
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
