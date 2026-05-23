import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { attendancePaths } from "@/lib/attendanceApi";
import { todayISTDateString } from "@/lib/attendanceIst";
import type { AttendanceApiPrefix, AttendanceDayDetail } from "@/lib/attendanceTypes";
import { AttendanceDayTimeline } from "@/components/attendance/AttendanceDayTimeline";
import { AttendanceControls } from "@/components/AttendanceControls";
import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MyAttendanceDay({ apiPrefix }: { apiPrefix: AttendanceApiPrefix }) {
  const { status } = useSmartAttendanceContext();
  const [date, setDate] = useState(todayISTDateString());
  const [detail, setDetail] = useState<AttendanceDayDetail | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const out = await api<AttendanceDayDetail>(attendancePaths(apiPrefix).myDay(date));
      setDetail(out);
    } catch (e) {
      setErr((e as Error).message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, date]);

  useEffect(() => {
    void load();
  }, [load, status]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">Times shown in IST (India).</p>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="att-date">Date (IST)</Label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>
      <AttendanceControls />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}
      {detail ? <AttendanceDayTimeline detail={detail} /> : null}
    </div>
  );
}
