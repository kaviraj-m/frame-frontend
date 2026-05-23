import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { AttendanceDayTimeline } from "@/components/attendance/AttendanceDayTimeline";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { todayISTDateString, formatMinutesAsHours } from "@/lib/attendanceIst";
import type { AttendanceDayDetail, AttendanceUserDaySummary } from "@/lib/attendanceTypes";
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

export function AdminAttendanceReportPage() {
  const [date, setDate] = useState(todayISTDateString());
  const [rows, setRows] = useState<AttendanceUserDaySummary[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AttendanceDayDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadDaily = useCallback(async () => {
    setErr("");
    setLoading(true);
    setExpandedUserId(null);
    setDetail(null);
    try {
      const path =
        date === todayISTDateString()
          ? apiPaths.adminAttendanceToday
          : apiPaths.adminAttendanceDaily(date);
      const out = await api<AttendanceUserDaySummary[]>(path);
      setRows(out);
    } catch (e) {
      setErr((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void loadDaily();
  }, [loadDaily]);

  async function loadUserDetail(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setDetail(null);
      return;
    }
    setExpandedUserId(userId);
    setDetailLoading(true);
    setDetail(null);
    try {
      const out = await api<AttendanceDayDetail>(apiPaths.adminAttendanceUserDay(userId, date));
      setDetail(out);
    } catch (e) {
      setErr((e as Error).message);
      setExpandedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <nav className="breadcrumb text-sm mb-3">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Attendance</span>
      </nav>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Attendance report</h2>
        <p className="text-sm text-muted-foreground mt-1">Times shown in IST (India).</p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="admin-att-date">Date (IST)</Label>
          <Input
            id="admin-att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username…"
            aria-label="Filter users"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadDaily()} disabled={loading}>
          Refresh
        </Button>
      </div>
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Break</TableHead>
              <TableHead className="text-right">Timeline</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {filtered.map((r) => (
              <Fragment key={r.userId}>
                <TableRow>
                  <TableCell className="font-medium">{r.username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatWorkdayStart(r.workdayStart)}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right text-sm">{formatMinutesAsHours(r.presentMinutes)}</TableCell>
                  <TableCell className="text-right text-sm">{formatMinutesAsHours(r.breakMinutes)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void loadUserDetail(r.userId)}
                    >
                      {expandedUserId === r.userId ? "Hide" : "View"} ({r.segmentCount})
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedUserId === r.userId && (
                  <TableRow key={`${r.userId}-detail`}>
                    <TableCell colSpan={7} className="bg-muted/20">
                      {detailLoading ? (
                        <p className="text-sm text-muted-foreground py-2">Loading timeline…</p>
                      ) : detail ? (
                        <AttendanceDayTimeline detail={detail} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users match this date or filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className={cn("text-sm text-muted-foreground mt-3", loading && "opacity-60")}>
          {loading ? "Loading…" : (
            <>
              Showing <strong>{filtered.length}</strong> user{filtered.length === 1 ? "" : "s"}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
