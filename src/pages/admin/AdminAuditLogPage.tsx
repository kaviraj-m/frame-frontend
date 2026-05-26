import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { formatTableDateTime } from "@/lib/formatDisplay";
import {
  auditDateRangeValid,
  fetchAllAuditLogs,
  fetchAuditLogPage,
  type AuditLogFilters,
  type AuditLogRow,
} from "@/lib/auditLogFilters";
import { exportAuditLogsToExcel } from "@/lib/exportAuditLogExcel";
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
import {
  AuditEntryDetail,
  auditActionLabel,
  auditActionOptions,
  auditEntryHasDetail,
} from "@/lib/auditLogDisplay";

const PAGE_SIZE = 50;

const filterSelectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]";

const EMPTY_FILTERS: AuditLogFilters = {
  search: "",
  entityType: "",
  entityId: "",
  action: "",
  dateFrom: "",
  dateTo: "",
};

export function AdminAuditLogPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const currentFilters = useMemo<AuditLogFilters>(
    () => ({ search, entityType, entityId, action, dateFrom, dateTo }),
    [search, entityType, entityId, action, dateFrom, dateTo],
  );

  const dateRangeInvalid = useMemo(
    () => !auditDateRangeValid(dateFrom, dateTo) && !!(dateFrom.trim() || dateTo.trim()),
    [dateFrom, dateTo],
  );

  const fetchPage = useCallback(async (p: number, filters: AuditLogFilters) => {
    if (!auditDateRangeValid(filters.dateFrom, filters.dateTo)) {
      setErr("End date must be on or after start date.");
      setLoading(false);
      return;
    }
    setErr("");
    setExportMsg("");
    setLoading(true);
    try {
      const out = await fetchAuditLogPage(p, PAGE_SIZE, filters);
      setItems(out.items ?? []);
      setTotal(out.total ?? 0);
      setPage(out.page ?? p);
      setExpanded({});
    } catch (e) {
      setErr((e as Error).message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(1, EMPTY_FILTERS);
  }, [fetchPage]);

  const actionOptions = useMemo(() => auditActionOptions(), []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilters() {
    if (dateRangeInvalid) return;
    void fetchPage(1, currentFilters);
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
  }

  function onFilterKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyFilters();
  }

  async function handleExportExcel() {
    if (dateRangeInvalid || total === 0) return;
    setExporting(true);
    setExportMsg("");
    setErr("");
    try {
      setExportMsg("Preparing export…");
      const rows = await fetchAllAuditLogs(currentFilters);
      if (rows.length === 0) {
        setExportMsg("");
        setErr("No rows to export for the current filters.");
        return;
      }
      exportAuditLogsToExcel(rows);
      setExportMsg(`Exported ${rows.length} entries.`);
    } catch (e) {
      setErr((e as Error).message);
      setExportMsg("");
    } finally {
      setExporting(false);
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtersBusy = loading || exporting;
  const canExport = !dateRangeInvalid && total > 0 && !filtersBusy;

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <nav className="breadcrumb text-sm mb-3">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Audit log</span>
      </nav>
      <p className="text-sm text-muted-foreground mb-3">
        Who changed what on orders and customer queries.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onFilterKeyDown}
            placeholder="Search summary, ID, username…"
            aria-label="Search audit log"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            disabled={!canExport}
          >
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void fetchPage(page, currentFilters)}
            disabled={filtersBusy || dateRangeInvalid}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Entity</span>
          <select
            className={filterSelectClass}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            aria-label="Entity type"
          >
            <option value="">All</option>
            <option value="order">Orders</option>
            <option value="query">Queries</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">ID</span>
          <Input
            className="font-mono text-xs min-w-[140px]"
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            onKeyDown={onFilterKeyDown}
            placeholder="Order / query ID"
            aria-label="Entity ID"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">Action</span>
          <select
            className={filterSelectClass}
            style={{ minWidth: 180 }}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            aria-label="Action"
          >
            <option value="">All actions</option>
            {actionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">From</span>
          <Input
            type="date"
            className="w-auto min-w-[140px] [color-scheme:dark]"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">To</span>
          <Input
            type="date"
            className="w-auto min-w-[140px] [color-scheme:dark]"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
          />
        </label>
        {(dateFrom || dateTo) && (
          <Button type="button" variant="ghost" size="sm" onClick={clearDates}>
            Clear dates
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={applyFilters}
          disabled={filtersBusy || dateRangeInvalid}
        >
          Apply filters
        </Button>
      </div>

      {dateRangeInvalid && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>End date must be on or after start date.</AlertDescription>
        </Alert>
      )}
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      {exportMsg && !err && (
        <Alert role="status">
          <AlertDescription>{exportMsg}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading audit log…
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((item) => {
                const dt = formatTableDateTime(item.createdAt);
                const hasDetail = auditEntryHasDetail(item);
                const isOpen = expanded[item.id];

                return (
                  <Fragment key={item.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">{dt.date}</div>
                          <div className="text-xs text-muted-foreground/80">{dt.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[0.65rem]">
                          {item.entityType}
                        </Badge>
                        <div className="font-mono text-xs text-muted-foreground mt-1.5">
                          {item.entityType === "order" ? (
                            <Link
                              to={`/admin/orders/${encodeURIComponent(item.entityId)}`}
                              className="text-primary hover:underline"
                            >
                              {item.entityId}
                            </Link>
                          ) : (
                            item.entityId
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{auditActionLabel(item.action)}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{item.actorUsername || "—"}</div>
                        <Badge variant="secondary" className="mt-1 text-[0.65rem]">
                          {item.actorRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[280px]">
                        {item.summary}
                      </TableCell>
                      <TableCell>
                        {hasDetail ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(item.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? "Hide" : "View"}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {hasDetail && isOpen && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="py-4">
                          <AuditEntryDetail item={item} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No audit entries match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading…"
            ) : (
              <>
                Showing <strong>{items.length}</strong> of <strong>{total}</strong> entries
                {totalPages > 1 && (
                  <>
                    {" "}
                    · page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </>
                )}
              </>
            )}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1 || filtersBusy || dateRangeInvalid}
                onClick={() => void fetchPage(page - 1, currentFilters)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || filtersBusy || dateRangeInvalid}
                onClick={() => void fetchPage(page + 1, currentFilters)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
