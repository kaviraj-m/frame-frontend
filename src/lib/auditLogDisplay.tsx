import type { ReactNode } from "react";
import { formatMoney } from "@/lib/formatDisplay";
import type { AuditLogRow } from "@/lib/auditLogFilters";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";

export type AuditChange = { field: string; label: string; old: string; new: string };

export const AUDIT_ACTION_LABELS: Record<string, { label: string; showChanges?: boolean }> = {
  "query.created": { label: "Query created" },
  "query.remarks_updated": { label: "Remark added" },
  "order.confirmed": { label: "Order confirmed" },
  "order.asset_uploaded": { label: "Asset uploaded" },
  "order.asset_deleted": { label: "Asset deleted" },
  "order.design_taken": { label: "Design taken" },
  "order.design_shared": { label: "Design shared" },
  "order.design_preview_remarks_updated": { label: "Preview remark" },
  "order.design_decision": { label: "Design decision" },
  "order.print_done": { label: "Print done" },
  "order.frame_ready": { label: "Frame ready" },
  "order.balance_payment_recorded": { label: "Balance payment" },
  "order.balance_fully_paid": { label: "Balance fully paid" },
  "order.tracking_saved": { label: "Tracking saved" },
  "order.dispatched": { label: "Dispatched" },
  "order.completed": { label: "Completed" },
  "order.admin_patch": { label: "Order patched", showChanges: true },
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action]?.label ?? action;
}

export function auditActionOptions(): { value: string; label: string }[] {
  return Object.entries(AUDIT_ACTION_LABELS).map(([value, { label }]) => ({ value, label }));
}

export function renderAuditMetadataChips(item: AuditLogRow): ReactNode {
  const m = item.metadata;
  if (!m || Object.keys(m).length === 0) return null;
  const chips: ReactNode[] = [];

  if (m.customerUsername != null && String(m.customerUsername).trim()) {
    chips.push(
      <Badge key="cu" variant="secondary">
        @{String(m.customerUsername)}
      </Badge>,
    );
  }
  if (m.queryId != null && String(m.queryId).trim()) {
    chips.push(
      <Badge key="qid" variant="secondary" className="font-mono text-xs">
        Query {String(m.queryId)}
      </Badge>,
    );
  }
  if (m.frameSize != null && String(m.frameSize).trim()) {
    chips.push(
      <Badge key="fs" variant="secondary">
        {String(m.frameSize)}
      </Badge>,
    );
  }
  if (typeof m.amount === "number") {
    chips.push(
      <Badge key="amt" variant="secondary">
        {formatMoney(m.amount)}
      </Badge>,
    );
  }
  if (m.remarkPreview != null && String(m.remarkPreview).trim()) {
    chips.push(
      <Badge key="rp" variant="secondary" className="max-w-[360px] truncate">
        &ldquo;{String(m.remarkPreview)}&rdquo;
      </Badge>,
    );
  }
  if (m.hasImage === true) {
    chips.push(
      <Badge key="img" variant="secondary">
        (Photo attached)
      </Badge>,
    );
  }
  if (m.assetKind != null) {
    chips.push(
      <Badge key="ak" variant="secondary">
        {String(m.assetKind)}
      </Badge>,
    );
  }
  if (m.decision != null) {
    chips.push(
      <Badge key="dec" variant="secondary">
        {String(m.decision)}
      </Badge>,
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-2">{chips}</div>;
}

export function AuditChangesTable({ changes }: { changes: AuditChange[] }) {
  return (
    <Table>
      <TableHeaderBand>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Before</TableHead>
          <TableHead>After</TableHead>
        </TableRow>
      </TableHeaderBand>
      <TableBody>
        {changes.map((c) => (
          <TableRow key={c.field}>
            <TableCell className="font-semibold">{c.label}</TableCell>
            <TableCell className="text-muted-foreground line-through">{c.old || "—"}</TableCell>
            <TableCell className="text-[var(--ok)]">{c.new || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function auditEntryHasDetail(item: AuditLogRow): boolean {
  const cfg = AUDIT_ACTION_LABELS[item.action];
  const changes = item.changes ?? [];
  const showChanges = (cfg?.showChanges ?? changes.length > 0) && changes.length > 0;
  const meta = renderAuditMetadataChips(item);
  return showChanges || !!meta;
}

export function AuditEntryDetail({
  item,
  compact,
}: {
  item: AuditLogRow;
  compact?: boolean;
}) {
  const cfg = AUDIT_ACTION_LABELS[item.action];
  const changes = item.changes ?? [];
  const showChanges = (cfg?.showChanges ?? changes.length > 0) && changes.length > 0;
  const meta = renderAuditMetadataChips(item);
  if (!showChanges && !meta) return null;
  return (
    <div className={compact ? "text-sm" : undefined}>
      {showChanges && <AuditChangesTable changes={changes} />}
      {!showChanges && meta}
      {showChanges && meta && <div className="mt-2.5">{meta}</div>}
    </div>
  );
}
