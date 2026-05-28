import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { attendancePaths } from "@/lib/attendanceApi";
import {
  defaultPermissionStartEnd,
  validateSelfApplyPermission,
} from "@/lib/attendancePermission";
import { todayISTDateString } from "@/lib/attendanceIst";
import type { AttendanceApiPrefix, AttendancePermission } from "@/lib/attendanceTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  apiPrefix: AttendanceApiPrefix;
  /** Calendar day being viewed in the timeline (apply always uses today). */
  viewDate: string;
  /** From GET my-day for today — avoids a separate permissions poll. */
  permissionsFromDay?: AttendancePermission[] | null;
  onSaved?: () => void;
};

export function PermissionSelfServicePanel({
  apiPrefix,
  viewDate,
  permissionsFromDay,
  onSaved,
}: Props) {
  const applyDate = todayISTDateString();
  const canApplyToday = viewDate === applyDate;
  const defaults = useMemo(() => defaultPermissionStartEnd(), []);

  const [permissions, setPermissions] = useState<AttendancePermission[]>([]);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const useParentList = permissionsFromDay !== undefined;

  const fetchPermissions = useCallback(async () => {
    setErr("");
    try {
      const list = await api<AttendancePermission[]>(attendancePaths(apiPrefix).permissions(applyDate));
      setPermissions(list);
    } catch (e) {
      setErr((e as Error).message);
      setPermissions([]);
    }
  }, [apiPrefix, applyDate]);

  useEffect(() => {
    if (useParentList) {
      setPermissions(permissionsFromDay ?? []);
      return;
    }
    if (canApplyToday) {
      void fetchPermissions();
    } else {
      setPermissions([]);
    }
  }, [useParentList, permissionsFromDay, canApplyToday, fetchPermissions]);

  const dayPermissions = useMemo(
    () => permissions.filter((p) => p.date === viewDate),
    [permissions, viewDate],
  );

  const todayPermissions = useMemo(
    () => permissions.filter((p) => p.date === applyDate),
    [permissions, applyDate],
  );

  function openConfirm() {
    setErr("");
    const validationErr = validateSelfApplyPermission({
      applyDate,
      startTime,
      endTime,
      existing: todayPermissions,
    });
    if (validationErr) {
      setErr(validationErr);
      return;
    }
    setConfirmOpen(true);
  }

  async function submitConfirmed() {
    setErr("");
    setSaving(true);
    try {
      await api(attendancePaths(apiPrefix).createPermission, {
        method: "POST",
        body: JSON.stringify({
          date: applyDate,
          startTime,
          endTime,
          note: note.trim() || undefined,
        }),
      });
      setNote("");
      setConfirmOpen(false);
      const next = defaultPermissionStartEnd();
      setStartTime(next.startTime);
      setEndTime(next.endTime);
      if (useParentList) {
        onSaved?.();
      } else {
        await fetchPermissions();
        onSaved?.();
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold">Permission (excused absence)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Apply a time window for <strong>today (IST)</strong> only. Start time must be now or later;
          it cannot overlap an existing permission. Permission time is tracked separately from
          present time and takes effect immediately after you confirm.
        </p>
      </div>

      {!canApplyToday ? (
        <p className="text-sm text-amber-400/90">
          Permission can only be applied for today. Switch the date above to today ({applyDate}) to
          apply.
        </p>
      ) : null}

      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>Date (IST)</Label>
          <p className="text-sm font-mono tabular-nums h-10 flex items-center px-3 rounded-md border bg-muted/30">
            {applyDate} (today)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="self-perm-start">Start (IST)</Label>
          <Input
            id="self-perm-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={!canApplyToday || saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="self-perm-end">End (IST)</Label>
          <Input
            id="self-perm-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!canApplyToday || saving}
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[200px]">
          <Label htmlFor="self-perm-note">Note</Label>
          <Input
            id="self-perm-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reason"
            disabled={!canApplyToday || saving}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => openConfirm()}
          disabled={!canApplyToday || saving}
        >
          Apply permission
        </Button>
      </div>

      {dayPermissions.length > 0 ? (
        <ul className="text-sm space-y-2">
          <p className="text-xs text-muted-foreground">
            Recorded for {viewDate}:
          </p>
          {dayPermissions.map((p) => (
            <li key={p.id} className="text-muted-foreground">
              <span className="font-mono text-foreground">
                {p.startTime}–{p.endTime}
              </span>
              {p.note?.trim() ? (
                <span className="text-foreground"> · Reason: {p.note.trim()}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No permission recorded for {viewDate}.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply permission?</DialogTitle>
            <DialogDescription>
              This will record excused absence for the window below. It cannot overlap existing
              permission for today.
            </DialogDescription>
          </DialogHeader>
          <dl className="text-sm space-y-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-16">Date</dt>
              <dd className="font-mono">{applyDate}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-16">Time</dt>
              <dd className="font-mono">
                {startTime} – {endTime} (IST)
              </dd>
            </div>
            {note.trim() ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-16">Note</dt>
                <dd>{note.trim()}</dd>
              </div>
            ) : null}
          </dl>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitConfirmed()} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
