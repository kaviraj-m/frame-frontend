import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { AttendanceDayTimeline } from "@/components/attendance/AttendanceDayTimeline";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { todayISTDateString, formatSecondsAsHms } from "@/lib/attendanceIst";
import type { AttendanceDayDetail, AttendancePermission, AttendanceUserDaySummary } from "@/lib/attendanceTypes";
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
import {
  RESPONSIVE_FIXED_INPUT_180,
  RESPONSIVE_FIXED_INPUT_220,
  RESPONSIVE_SEARCH_WRAP,
} from "@/lib/responsive";

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

export function AdminAttendanceReportPage() {
  const [date, setDate] = useState(todayISTDateString());
  const [rows, setRows] = useState<AttendanceUserDaySummary[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AttendanceDayDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [permissions, setPermissions] = useState<AttendancePermission[]>([]);
  const [permUserId, setPermUserId] = useState("");
  const [permStart, setPermStart] = useState("09:00");
  const [permEnd, setPermEnd] = useState("18:00");
  const [permNote, setPermNote] = useState("");
  const [permSaving, setPermSaving] = useState(false);

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

  const loadPermissions = useCallback(async () => {
    try {
      const out = await api<AttendancePermission[]>(apiPaths.adminAttendancePermissions(date));
      setPermissions(out);
    } catch {
      setPermissions([]);
    }
  }, [date]);

  useEffect(() => {
    void loadDaily();
    void loadPermissions();
  }, [loadDaily, loadPermissions]);

  async function savePermission() {
    if (!permUserId) {
      setErr("Select a user for permission");
      return;
    }
    setPermSaving(true);
    setErr("");
    try {
      await api(apiPaths.adminCreateAttendancePermission, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: permUserId,
          date,
          startTime: permStart,
          endTime: permEnd,
          note: permNote,
        }),
      });
      await loadPermissions();
      await loadDaily();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPermSaving(false);
    }
  }

  async function deletePermission(id: string) {
    setErr("");
    try {
      await api(apiPaths.adminDeleteAttendancePermission(id), { method: "DELETE" });
      await loadPermissions();
      await loadDaily();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Attendance report</h2>
          <p className="text-sm text-muted-foreground mt-1">Times shown in IST (India).</p>
        </div>
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link to="/admin/reports/attendance/user">User attendance detail</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="admin-att-date">Date (IST)</Label>
          <Input
            id="admin-att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={RESPONSIVE_FIXED_INPUT_180}
          />
        </div>
        <div className={RESPONSIVE_SEARCH_WRAP}>
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
      <div className="w-full">
        <Table stickyFirstColumn>
          <TableHeaderBand>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Break</TableHead>
              <TableHead className="text-right">Offline</TableHead>
              <TableHead className="text-right">Permission</TableHead>
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
                  <TableCell className="text-right text-sm">{formatSecondsAsHms(r.presentSeconds)}</TableCell>
                  <TableCell className="text-right text-sm">{formatSecondsAsHms(r.breakSeconds)}</TableCell>
                  <TableCell className="text-right text-sm">{formatSecondsAsHms(r.offlineSeconds ?? 0)}</TableCell>
                  <TableCell className="text-right text-sm">{formatSecondsAsHms(r.permissionSeconds ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <Link
                          to={`/admin/reports/attendance/user?userId=${encodeURIComponent(r.userId)}&from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`}
                        >
                          View range
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void loadUserDetail(r.userId)}
                      >
                        {expandedUserId === r.userId ? "Hide" : "View"} ({r.segmentCount})
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedUserId === r.userId && (
                  <TableRow key={`${r.userId}-detail`}>
                    <TableCell colSpan={9} className="bg-muted/20">
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
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-base font-semibold">Permission (excused absence)</h3>
        <p className="text-sm text-muted-foreground">
          Grant a time window on a date. This counts as permission, not unpresent.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="perm-user">User</Label>
            <select
              id="perm-user"
              className={cn(
                "flex h-9 rounded-md border border-input bg-background px-3 text-sm",
                RESPONSIVE_FIXED_INPUT_220,
              )}
              value={permUserId}
              onChange={(e) => setPermUserId(e.target.value)}
            >
              <option value="">Select user</option>
              {rows.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.username}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-start">Start (IST)</Label>
            <Input id="perm-start" type="time" value={permStart} onChange={(e) => setPermStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-end">End (IST)</Label>
            <Input id="perm-end" type="time" value={permEnd} onChange={(e) => setPermEnd(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="perm-note">Note</Label>
            <Input id="perm-note" value={permNote} onChange={(e) => setPermNote(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="button" size="sm" onClick={() => void savePermission()} disabled={permSaving}>
            Add permission
          </Button>
        </div>
        {permissions.length > 0 ? (
          <ul className="text-sm space-y-2">
            {permissions.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {p.userId} · {p.date} · {p.startTime}–{p.endTime}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void deletePermission(p.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No permissions for this date.</p>
        )}
      </div>
    </div>
  );
}
