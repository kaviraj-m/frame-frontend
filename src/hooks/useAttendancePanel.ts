import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { attendanceSessionStorageKey } from "../lib/attendanceStorage";
import type { AttendanceApiPrefix, AttendanceCurrentPayload, AttendanceSession, BreakSession } from "../lib/attendanceTypes";

export function useAttendancePanel(apiPrefix: AttendanceApiPrefix) {
  const [attendanceId, setAttendanceId] = useState("");
  const [breakId, setBreakId] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    (async () => {
      try {
        const cur = await api<AttendanceCurrentPayload>(`${apiPrefix}/attendance/current`);
        if (cancelled) return;
        const key = attendanceSessionStorageKey(apiPrefix);
        if (cur.attendance) {
          setAttendanceId(cur.attendance.id);
          setBreakId(cur.activeBreak?.id ?? "");
          setMsg("Session synced with server");
        } else {
          sessionStorage.removeItem(key);
        }
      } catch {
        const key = attendanceSessionStorageKey(apiPrefix);
        const raw = sessionStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { attendanceId?: string; breakId?: string };
            if (parsed.attendanceId) setAttendanceId(parsed.attendanceId);
            if (parsed.breakId) setBreakId(parsed.breakId);
            setMsg("Restored IDs from browser (verify with server when online)");
          } catch {
            sessionStorage.removeItem(key);
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiPrefix]);

  useEffect(() => {
    if (!hydrated) return;
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    const key = attendanceSessionStorageKey(apiPrefix);
    if (attendanceId || breakId) {
      sessionStorage.setItem(key, JSON.stringify({ attendanceId, breakId }));
    } else {
      sessionStorage.removeItem(key);
    }
  }, [attendanceId, breakId, apiPrefix, hydrated]);

  async function startAttendance() {
    setError("");
    try {
      const a = await api<AttendanceSession>(`${apiPrefix}/attendance/start`, { method: "POST" });
      setAttendanceId(a.id);
      setBreakId("");
      setMsg(`Attendance started (${a.id})`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function endAttendance() {
    if (!attendanceId) return;
    setError("");
    try {
      await api(`${apiPrefix}/attendance/${attendanceId}/end`, { method: "POST" });
      setMsg("Attendance ended");
      setAttendanceId("");
      setBreakId("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function startBreak() {
    if (!attendanceId) return;
    setError("");
    try {
      const b = await api<BreakSession>(`${apiPrefix}/attendance/${attendanceId}/break/start`, {
        method: "POST",
      });
      setBreakId(b.id);
      setMsg(`Break started (${b.id})`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function endBreak() {
    if (!breakId) return;
    setError("");
    try {
      await api(`${apiPrefix}/breaks/${breakId}/end`, { method: "POST" });
      setMsg("Break ended");
      setBreakId("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return {
    attendanceId,
    breakId,
    msg,
    error,
    startAttendance,
    endAttendance,
    startBreak,
    endBreak,
  };
}
