import { api } from "./api";
import { apiPaths } from "./apiPaths";
import { isValidDateRange, type CreatedDateRange } from "./executiveOrdersList";

export type AuditLogFilters = {
  search: string;
  entityType: string;
  entityId: string;
  action: string;
  dateFrom: string;
  dateTo: string;
};

export type AuditLogRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  actorUsername: string;
  actorRole: string;
  summary: string;
  changes?: { field: string; label: string; old: string; new: string }[];
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogListResponse = {
  items: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

export const AUDIT_EXPORT_PAGE_SIZE = 100;

export function auditDateRangeValid(dateFrom: string, dateTo: string): boolean {
  return isValidDateRange({ from: dateFrom, to: dateTo });
}

/** Local calendar date (YYYY-MM-DD) → API `from`/`to` RFC3339 bounds. */
export function dateRangeToApiParams(
  dateFrom: string,
  dateTo: string,
): { from?: string; to?: string } {
  const out: { from?: string; to?: string } = {};
  const from = dateFrom.trim();
  const to = dateTo.trim();
  if (from) {
    const d = new Date(`${from}T00:00:00`);
    if (!Number.isNaN(d.getTime())) out.from = d.toISOString();
  }
  if (to) {
    const d = new Date(`${to}T23:59:59.999`);
    if (!Number.isNaN(d.getTime())) out.to = d.toISOString();
  }
  return out;
}

export function buildAuditLogQueryParams(
  page: number,
  pageSize: number,
  filters: AuditLogFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.entityType.trim()) params.set("entityType", filters.entityType.trim());
  if (filters.entityId.trim()) params.set("entityId", filters.entityId.trim());
  if (filters.action.trim()) params.set("action", filters.action.trim());
  if (filters.search.trim()) params.set("q", filters.search.trim());
  const dates = dateRangeToApiParams(filters.dateFrom, filters.dateTo);
  if (dates.from) params.set("from", dates.from);
  if (dates.to) params.set("to", dates.to);
  return params;
}

export async function fetchAuditLogPage(
  page: number,
  pageSize: number,
  filters: AuditLogFilters,
): Promise<AuditLogListResponse> {
  const params = buildAuditLogQueryParams(page, pageSize, filters);
  return api<AuditLogListResponse>(`${apiPaths.adminAuditLogs}?${params.toString()}`);
}

/** Fetches every page matching filters (pageSize 100 per request). */
export async function fetchAllAuditLogs(filters: AuditLogFilters): Promise<AuditLogRow[]> {
  const all: AuditLogRow[] = [];
  let page = 1;
  let total = 0;
  for (;;) {
    const out = await fetchAuditLogPage(page, AUDIT_EXPORT_PAGE_SIZE, filters);
    const batch = out.items ?? [];
    total = out.total ?? 0;
    all.push(...batch);
    if (batch.length === 0 || all.length >= total) break;
    page += 1;
  }
  return all;
}

export type { CreatedDateRange };
