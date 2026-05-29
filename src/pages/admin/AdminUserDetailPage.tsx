import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminUserEditorModal } from "./users/AdminUserEditorModal";
import type { AdminUserRow } from "./users/adminUserTypes";
import type { OrderListSummary, QueryListSummary } from "./users/adminUserPerformanceTypes";
import { useAdminUserPerformance } from "./users/useAdminUserPerformance";
import { useAdminUsersList } from "./users/useAdminUsersList";
import { exportUserPerformanceToExcel } from "@/lib/exportUserPerformanceExcel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { RESPONSIVE_FIXED_INPUT_180 } from "@/lib/responsive";

const ATTENDANCE_TIMEZONE = "Asia/Kolkata";

function formatISTDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: ATTENDANCE_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function KpiCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function OrderMiniTable({
  rows,
  timeField,
}: {
  rows: OrderListSummary[] | null | undefined;
  timeField: "createdAt" | "updatedAt";
}) {
  const list = rows ?? [];
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">None on this day.</p>;
  }
  return (
    <div className="w-full">
      <Table stickyFirstColumn>
        <TableHeaderBand>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time (IST)</TableHead>
            <TableHead className="text-right">Open</TableHead>
          </TableRow>
        </TableHeaderBand>
        <TableBody>
          {list.map((o) => (
            <TableRow key={`${o.orderId}-${timeField}`}>
              <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
              <TableCell>
                <span className="font-medium">{o.customerUsername || "—"}</span>
                {o.customerPhoneNumber ? (
                  <span className="block text-xs text-muted-foreground">{o.customerPhoneNumber}</span>
                ) : null}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} small />
              </TableCell>
              <TableCell className="text-sm tabular-nums">{formatISTDateTime(o[timeField])}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/orders/${encodeURIComponent(o.orderId)}`}>Open order</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function QueryMiniTable({ rows }: { rows: QueryListSummary[] | null | undefined }) {
  const list = rows ?? [];
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">None on this day.</p>;
  }
  return (
    <div className="w-full">
      <Table stickyFirstColumn>
        <TableHeaderBand>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Created (IST)</TableHead>
          </TableRow>
        </TableHeaderBand>
        <TableBody>
          {list.map((q) => (
            <TableRow key={q.queryId}>
              <TableCell className="font-mono text-xs">{q.queryId}</TableCell>
              <TableCell>
                <span className="font-medium">{q.customerUsername || "—"}</span>
                <span className="block text-xs text-muted-foreground">{q.customerPhoneNumber}</span>
              </TableCell>
              <TableCell className="text-sm tabular-nums">{formatISTDateTime(q.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const {
    user,
    from,
    setFrom,
    to,
    setTo,
    performance,
    expandedDate,
    dayDetail,
    loadingUser,
    loadingPerf,
    loadingDay,
    err,
    isExecutive,
    loadUser,
    loadPerformance,
    applyPreset,
    toggleDay,
  } = useAdminUserPerformance(userId);

  const { updateUser } = useAdminUsersList();
  const [editorOpen, setEditorOpen] = useState(false);

  const editorRow: AdminUserRow | null = user
    ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      }
    : null;

  if (loadingUser && !user) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Loading user…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <nav className="breadcrumb text-sm">
          <Link to="/admin/users">User management</Link>
        </nav>
        <Alert variant="destructive">
          <AlertDescription>{err || "User not found."}</AlertDescription>
        </Alert>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/admin/users">Back to users</Link>
        </Button>
      </div>
    );
  }

  const daily = performance?.daily ?? [];
  const summary = performance?.summary;

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <nav className="breadcrumb text-sm mb-1">
        <Link to="/admin/users">User management</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{user.username}</span>
      </nav>

      <PageHeader
        kicker="Team"
        title={user.username}
        description={
          isExecutive
            ? "Order and query activity by day (IST). Completed orders use the date of last status update when marked ORDER_COMPLETED."
            : "Account overview. Order performance is tracked for executive accounts only."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin/users">Back</Link>
            </Button>
            <Button type="button" size="sm" onClick={() => setEditorOpen(true)}>
              Edit user
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{user.role}</Badge>
        <Badge variant={user.isActive ? "success" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
        {user.executiveId ? (
          <span className="text-xs text-muted-foreground font-mono">Exec ID: {user.executiveId}</span>
        ) : null}
        {user.email?.trim() ? (
          <span className="text-xs text-muted-foreground">{user.email}</span>
        ) : null}
      </div>

      {err ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      {!isExecutive ? (
        <Card muted>
          <p className="text-sm text-muted-foreground">
            Order performance is tracked for executive accounts only. Use User management to edit this
            account.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="perf-from">From (IST)</Label>
              <Input
                id="perf-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={RESPONSIVE_FIXED_INPUT_180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perf-to">To (IST)</Label>
              <Input
                id="perf-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={RESPONSIVE_FIXED_INPUT_180}
              />
            </div>
            <div className="flex flex-wrap gap-2 pb-0.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset(7)}>
                Last 7 days
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset(30)}>
                Last 30 days
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset(90)}>
                Last 90 days
              </Button>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loadingPerf || !performance}
                onClick={() => {
                  if (!performance || !summary) return;
                  exportUserPerformanceToExcel({
                    username: user.username,
                    executiveId: user.executiveId,
                    from: performance.from,
                    to: performance.to,
                    summary,
                    daily,
                  });
                }}
              >
                Export Excel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void loadPerformance()}
                disabled={loadingPerf}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Orders created" value={summary?.ordersCreatedTotal ?? 0} hint="In selected range" />
            <KpiCard label="Orders completed" value={summary?.ordersCompletedTotal ?? 0} hint="By completion update" />
            <KpiCard label="Queries created" value={summary?.queriesCreatedTotal ?? 0} hint="In selected range" />
            <KpiCard label="In progress" value={summary?.ordersInProgress ?? 0} hint="All time, open orders" />
          </div>

          <div>
            <h3 className="text-base font-semibold mb-1">Daily breakdown</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {performance?.from} — {performance?.to}. Expand a day for order and query details.
            </p>
            <div className="w-full">
              <Table stickyFirstColumn>
                <TableHeaderBand>
                  <TableRow>
                    <TableHead>Date (IST)</TableHead>
                    <TableHead className="text-right">Queries</TableHead>
                    <TableHead className="text-right">Orders created</TableHead>
                    <TableHead className="text-right">Orders completed</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeaderBand>
                <TableBody>
                  {daily.map((row) => {
                    const hasActivity =
                      row.queriesCreated > 0 || row.ordersCreated > 0 || row.ordersCompleted > 0;
                    return (
                      <Fragment key={row.date}>
                        <TableRow className={cn(!hasActivity && "opacity-60")}>
                          <TableCell className="font-medium tabular-nums">{row.date}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.queriesCreated}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.ordersCreated}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.ordersCompleted}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void toggleDay(row.date)}
                              disabled={!hasActivity}
                            >
                              {expandedDate === row.date ? "Hide" : "View day"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedDate === row.date ? (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/20 p-4 space-y-6">
                              {loadingDay ? (
                                <p className="text-sm text-muted-foreground">Loading day details…</p>
                              ) : dayDetail ? (
                                <>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">Queries created</h4>
                                    <QueryMiniTable rows={dayDetail.createdQueries} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">Orders created</h4>
                                    <OrderMiniTable rows={dayDetail.createdOrders} timeField="createdAt" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">Orders completed</h4>
                                    <OrderMiniTable rows={dayDetail.completedOrders} timeField="updatedAt" />
                                  </div>
                                </>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                  {!loadingPerf && daily.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No data for this range.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <p className={cn("text-sm text-muted-foreground mt-3", loadingPerf && "opacity-60")}>
                {loadingPerf ? "Loading…" : (
                  <>
                    Showing <strong>{daily.length}</strong> day{daily.length === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      )}

      <AdminUserEditorModal
        open={editorOpen}
        editingUser={editorRow}
        onClose={() => setEditorOpen(false)}
        onCreate={async () => false}
        onUpdate={async (id, body) => {
          const ok = await updateUser(id, body);
          if (ok) {
            await loadUser();
            if (isExecutive) await loadPerformance();
          }
          return ok;
        }}
        onOpenChangePassword={() => setEditorOpen(false)}
        onRequestDelete={() => {}}
        canDelete={false}
      />
    </div>
  );
}
