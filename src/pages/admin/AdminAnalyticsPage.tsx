import { useMemo } from "react";
import { Link } from "react-router-dom";
import { HorizontalBarRow } from "@/components/admin/analytics/HorizontalBarRow";
import { KpiCard } from "@/components/admin/analytics/KpiCard";
import { Card } from "@/components/common/Card";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/formatDisplay";
import { exportAdminAnalyticsToExcel } from "@/lib/exportAdminAnalyticsExcel";
import { useAdminAnalytics } from "./analytics/useAdminAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function formatConversion(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return "—";
  return `${pct.toFixed(1)}%`;
}

export function AdminAnalyticsPage() {
  const { from, setFrom, to, setTo, data, loading, err, load, applyPreset } = useAdminAnalytics();

  const daily = data?.daily ?? [];
  const summary = data?.summary;

  const maxOrdersDay = useMemo(
    () => Math.max(1, ...daily.map((d) => d.ordersCreated)),
    [daily],
  );
  const maxRevenueDay = useMemo(() => {
    const vals = daily.map((d) => d.advanceCollected + d.fullPaymentTotal);
    return Math.max(1, ...vals, 1);
  }, [daily]);

  const maxStatus = useMemo(
    () => Math.max(1, ...(data?.statusBreakdown ?? []).map((s) => s.count)),
    [data?.statusBreakdown],
  );
  const maxFrameQty = useMemo(
    () => Math.max(1, ...(data?.topFrameSizes ?? []).map((f) => f.quantity)),
    [data?.topFrameSizes],
  );

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <PageHeader
        kicker="Insights"
        title="Analytics"
        description="Business overview by date range (IST). Advance is counted when an order is created; full payment when an order is completed."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="analytics-from">From (IST)</Label>
          <Input
            id="analytics-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={RESPONSIVE_FIXED_INPUT_180}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="analytics-to">To (IST)</Label>
          <Input
            id="analytics-to"
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
            disabled={loading || !data}
            onClick={() => {
              if (data) exportAdminAnalyticsToExcel(data);
            }}
          >
            Export Excel
          </Button>
          <Button type="button" size="sm" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {err ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
          loading && "opacity-60 pointer-events-none",
        )}
      >
        <KpiCard label="Queries created" value={summary?.queriesCreated ?? 0} hint="In range" />
        <KpiCard label="Orders created" value={summary?.ordersCreated ?? 0} hint="In range" />
        <KpiCard label="Orders completed" value={summary?.ordersCompleted ?? 0} hint="By completion date" />
        <KpiCard
          label="Conversion"
          value={formatConversion(summary?.conversionPercent ?? 0)}
          hint="Orders ÷ queries in range"
        />
        <KpiCard
          label="Advance collected"
          value={formatMoney(summary?.advanceCollected)}
          hint="On orders created"
        />
        <KpiCard
          label="Full payment"
          value={formatMoney(summary?.fullPaymentTotal)}
          hint="On orders completed"
        />
        <KpiCard
          label="In progress"
          value={summary?.ordersInProgress ?? 0}
          hint="Current pipeline snapshot"
        />
        <KpiCard label="Cancelled" value={summary?.ordersCancelled ?? 0} hint="Cancelled in range" />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-1">Daily trends</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {data ? `${data.from} — ${data.to}` : "—"}
        </p>
        <div className="w-full">
          <Table stickyFirstColumn>
            <TableHeaderBand>
              <TableRow>
                <TableHead>Date (IST)</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Orders created</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Advance</TableHead>
                <TableHead className="text-right">Full payment</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeaderBand>
            <TableBody>
              {daily.map((row) => {
                const revenue = row.advanceCollected + row.fullPaymentTotal;
                const barPct = Math.min(
                  100,
                  (row.ordersCreated / maxOrdersDay) * 50 + (revenue / maxRevenueDay) * 50,
                );
                const hasActivity =
                  row.queriesCreated > 0 ||
                  row.ordersCreated > 0 ||
                  row.ordersCompleted > 0 ||
                  revenue > 0;
                return (
                  <TableRow key={row.date} className={cn(!hasActivity && "opacity-50")}>
                    <TableCell className="font-medium tabular-nums">{row.date}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.queriesCreated}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.ordersCreated}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.ordersCompleted}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.advanceCollected)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.fullPaymentTotal)}
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/45"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && daily.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No data for this range.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-base font-semibold mb-1">Current pipeline</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Live order counts by status (not filtered by date range).
          </p>
          {(data?.statusBreakdown ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.statusBreakdown ?? []).map((row) => (
                <div key={row.status} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={row.status} small />
                    <span className="text-xs text-muted-foreground tabular-nums ml-auto">
                      {row.count}
                    </span>
                  </div>
                  <HorizontalBarRow
                    label=""
                    value={row.count}
                    max={maxStatus}
                    className="[&>div:first-child]:hidden"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-1">Top frame sizes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Line quantities on orders created in the selected range.
          </p>
          {(data?.topFrameSizes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No frame data in range.</p>
          ) : (
            <div className="space-y-3">
              {(data?.topFrameSizes ?? []).map((row) => (
                <HorizontalBarRow
                  key={row.frameSize}
                  label={row.frameSize}
                  value={row.quantity}
                  max={maxFrameQty}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-1">Executive leaderboard</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Top performers in range by orders completed. Click a name for day-wise detail.
        </p>
        <div className="w-full">
          <Table stickyFirstColumn>
            <TableHeaderBand>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Executive</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Orders created</TableHead>
                <TableHead className="text-right">Completed</TableHead>
              </TableRow>
            </TableHeaderBand>
            <TableBody>
              {(data?.executiveLeaderboard ?? []).map((row, i) => (
                <TableRow key={row.userId}>
                  <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <Link
                      to={`/admin/users/${encodeURIComponent(row.userId)}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.username}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.queriesCreated}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.ordersCreated}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.ordersCompleted}</TableCell>
                </TableRow>
              ))}
              {!loading && (data?.executiveLeaderboard ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No executive activity in this range.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm border-t border-border pt-4">
        <Link to="/admin/reports/attendance" className="text-primary hover:underline">
          Attendance report
        </Link>
        <Link to="/admin/orders" className="text-primary hover:underline">
          All orders
        </Link>
        <Link to="/admin/queries" className="text-primary hover:underline">
          All queries
        </Link>
      </div>
    </div>
  );
}
