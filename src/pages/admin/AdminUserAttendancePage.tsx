import { Fragment, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AttendanceDayTimeline } from "@/components/attendance/AttendanceDayTimeline";
import { Card } from "@/components/common/Card";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { formatSecondsAsHms } from "@/lib/attendanceIst";
import type { AttendanceDayDetail } from "@/lib/attendanceTypes";
import { exportUserAttendanceToExcel } from "@/lib/exportUserAttendanceExcel";
import { useAdminUserAttendanceRange } from "./users/useAdminUserAttendanceRange";
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

function statusBadge(status: string) {
  if (status === "present") {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Present</Badge>;
  }
  if (status === "break") {
    return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">Break</Badge>;
  }
  if (status === "permission") {
    return <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30">Permission</Badge>;
  }
  return <Badge variant="secondary">Offline</Badge>;
}

function formatWorkdayStart(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="min-w-[140px] flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function dayHasActivity(row: { segmentCount: number; presentSeconds: number; breakSeconds: number; workdayStart?: string }) {
  return row.segmentCount > 0 || row.presentSeconds > 0 || row.breakSeconds > 0 || Boolean(row.workdayStart);
}

export function AdminUserAttendancePage() {
  const {
    users,
    userId,
    setUserId,
    from,
    setFrom,
    to,
    setTo,
    data,
    loadingUsers,
    loading,
    err,
    loadRange,
    applyPreset,
  } = useAdminUserAttendanceRange();

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<AttendanceDayDetail | null>(null);
  const [dayLoading, setDayLoading] = useState(false);

  const loadDayDetail = useCallback(
    async (date: string) => {
      if (!userId.trim()) return;
      if (expandedDate === date) {
        setExpandedDate(null);
        setDayDetail(null);
        return;
      }
      setExpandedDate(date);
      setDayLoading(true);
      setDayDetail(null);
      try {
        const out = await api<AttendanceDayDetail>(apiPaths.adminAttendanceUserDay(userId, date));
        setDayDetail({
          ...out,
          segments: out.segments ?? [],
          sessions: out.sessions ?? [],
          breaks: out.breaks ?? [],
          permissions: out.permissions ?? [],
        });
      } catch {
        setExpandedDate(null);
      } finally {
        setDayLoading(false);
      }
    },
    [userId, expandedDate],
  );

  const daily = data?.daily ?? [];
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <nav className="breadcrumb text-sm mb-1">
        <Link to="/admin/reports/attendance">Attendance report</Link>
        <span className="breadcrumb-sep">/</span>
        <span>User attendance</span>
      </nav>

      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">User attendance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Full attendance history for one executive or designer. Times in IST (India). Max 90 days per search.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="att-user">User</Label>
          <select
            id="att-user"
            className="flex h-9 w-[220px] rounded-md border border-input bg-background px-3 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loadingUsers}
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="att-from">From (IST)</Label>
          <Input
            id="att-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="att-to">To (IST)</Label>
          <Input
            id="att-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[180px]"
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
          <Button type="button" size="sm" onClick={() => void loadRange()} disabled={loading || !userId}>
            {loading ? "Loading…" : "Search"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!data || loading}
            onClick={() => {
              if (!data) return;
              exportUserAttendanceToExcel({
                username: data.user.username,
                role: data.user.role,
                from: data.from,
                to: data.to,
                summary: data.summary,
                daily: data.daily,
              });
            }}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {err ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      {data && summary ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{data.user.role}</Badge>
            <span className="text-sm font-medium">{data.user.username}</span>
            <span className="text-xs text-muted-foreground font-mono">{data.user.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Days in range" value={summary.daysInRange} />
            <KpiCard label="Days with activity" value={summary.daysWithActivity} />
            <KpiCard label="Present (total)" value={formatSecondsAsHms(summary.presentSeconds)} />
            <KpiCard label="Break (total)" value={formatSecondsAsHms(summary.breakSeconds)} />
            <KpiCard label="Offline (total)" value={formatSecondsAsHms(summary.offlineSeconds)} />
          </div>

          <div>
            <h3 className="text-base font-semibold mb-1">Daily breakdown</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {data.from} — {data.to}. Expand a day for timeline detail.
            </p>
            <div className="overflow-auto w-full">
              <Table>
                <TableHeaderBand>
                  <TableRow>
                    <TableHead>Date (IST)</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Break</TableHead>
                    <TableHead className="text-right">Offline</TableHead>
                    <TableHead className="text-right">Timeline</TableHead>
                  </TableRow>
                </TableHeaderBand>
                <TableBody>
                  {daily.map((row) => {
                    const hasActivity = dayHasActivity(row);
                    return (
                      <Fragment key={row.date}>
                        <TableRow className={cn(!hasActivity && "opacity-60")}>
                          <TableCell className="font-medium tabular-nums">{row.date}</TableCell>
                          <TableCell className="text-sm tabular-nums">{formatWorkdayStart(row.workdayStart)}</TableCell>
                          <TableCell>{statusBadge(row.status)}</TableCell>
                          <TableCell className="text-right text-sm">{formatSecondsAsHms(row.presentSeconds)}</TableCell>
                          <TableCell className="text-right text-sm">{formatSecondsAsHms(row.breakSeconds)}</TableCell>
                          <TableCell className="text-right text-sm">{formatSecondsAsHms(row.offlineSeconds ?? 0)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void loadDayDetail(row.date)}
                              disabled={!hasActivity}
                            >
                              {expandedDate === row.date ? "Hide" : "View day"} ({row.segmentCount})
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedDate === row.date ? (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/20 p-4">
                              {dayLoading ? (
                                <p className="text-sm text-muted-foreground">Loading timeline…</p>
                              ) : dayDetail ? (
                                <AttendanceDayTimeline detail={dayDetail} />
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                  {!loading && daily.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No days in this range.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <p className={cn("text-sm text-muted-foreground mt-3", loading && "opacity-60")}>
                {loading ? "Loading…" : (
                  <>
                    Showing <strong>{daily.length}</strong> day{daily.length === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      ) : (
        !loading &&
        !err && (
          <p className="text-sm text-muted-foreground">
            Select a user and date range, then click Search to load attendance.
          </p>
        )
      )}
    </div>
  );
}
