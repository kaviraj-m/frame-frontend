import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { attendancePaths, TAB_HIDDEN_GRACE_MS } from "../lib/attendanceApi";
import { attendanceSessionStorageKey } from "../lib/attendanceStorage";
import type {
  AttendanceApiPrefix,
  AttendanceCurrentPayload,
  AttendanceEndReason,
  AttendanceSession,
  BreakSession,
} from "../lib/attendanceTypes";

export type SmartAttendanceStatus =
  | "idle"
  | "on_clock"
  | "on_break"
  | "away_warning"
  | "stopped_tab";

export type SmartAttendanceState = {
  attendanceId: string;
  breakId: string;
  status: SmartAttendanceStatus;
  awaySecondsLeft: number | null;
  msg: string;
  error: string;
  hydrated: boolean;
  startAttendance: () => Promise<void>;
  endAttendance: (reason?: AttendanceEndReason) => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
};

export function useSmartAttendance(apiPrefix: AttendanceApiPrefix): SmartAttendanceState {
  const paths = attendancePaths(apiPrefix);
  const [attendanceId, setAttendanceId] = useState("");
  const [breakId, setBreakId] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [awaySecondsLeft, setAwaySecondsLeft] = useState<number | null>(null);
  const [tabStopped, setTabStopped] = useState(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideStartedAtRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    hideStartedAtRef.current = null;
    setAwaySecondsLeft(null);
  }, []);

  const syncFromServer = useCallback(async () => {
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    if (cur.attendance) {
      setAttendanceId(cur.attendance.id);
      setBreakId(cur.activeBreak?.id ?? "");
      setTabStopped(false);
    } else {
      setAttendanceId("");
      setBreakId("");
    }
  }, [paths.current]);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    (async () => {
      try {
        await syncFromServer();
        if (!cancelled) setMsg("Session synced with server");
      } catch {
        const key = attendanceSessionStorageKey(apiPrefix);
        const raw = sessionStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { attendanceId?: string; breakId?: string };
            if (parsed.attendanceId) setAttendanceId(parsed.attendanceId);
            if (parsed.breakId) setBreakId(parsed.breakId);
            setMsg("Restored IDs from browser (verify when online)");
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
  }, [apiPrefix, syncFromServer]);

  useEffect(() => {
    if (!hydrated) return;
    const key = attendanceSessionStorageKey(apiPrefix);
    if (attendanceId || breakId) {
      sessionStorage.setItem(key, JSON.stringify({ attendanceId, breakId }));
    } else {
      sessionStorage.removeItem(key);
    }
  }, [attendanceId, breakId, apiPrefix, hydrated]);

  const endAttendance = useCallback(
    async (reason: AttendanceEndReason = "manual") => {
      if (!attendanceId) return;
      setError("");
      clearHideTimer();
      await api(paths.end(attendanceId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setAttendanceId("");
      setBreakId("");
      if (reason === "tab_hidden") {
        setTabStopped(true);
        setMsg("Attendance stopped — you left the tab for more than 30 seconds.");
      } else {
        setTabStopped(false);
        setMsg("Attendance ended");
      }
    },
    [attendanceId, clearHideTimer, paths],
  );

  const recordPresence = useCallback(
    async (event: "tab_hidden" | "tab_visible") => {
      if (!attendanceId) return;
      try {
        await api(paths.presence, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event }),
        });
      } catch {
        // Best-effort audit logging
      }
    },
    [attendanceId, paths.presence],
  );

  const onTabHidden = useCallback(() => {
    if (!attendanceId) return;
    void recordPresence("tab_hidden");
    clearHideTimer();
    hideStartedAtRef.current = Date.now();
    setAwaySecondsLeft(Math.ceil(TAB_HIDDEN_GRACE_MS / 1000));
    tickRef.current = setInterval(() => {
      if (hideStartedAtRef.current == null) return;
      const left = Math.max(0, TAB_HIDDEN_GRACE_MS - (Date.now() - hideStartedAtRef.current));
      setAwaySecondsLeft(Math.ceil(left / 1000));
    }, 500);
    hideTimerRef.current = setTimeout(() => {
      void endAttendance("tab_hidden");
    }, TAB_HIDDEN_GRACE_MS);
  }, [attendanceId, clearHideTimer, endAttendance, recordPresence]);

  const onTabVisible = useCallback(() => {
    if (!attendanceId) return;
    clearHideTimer();
    void recordPresence("tab_visible");
  }, [attendanceId, clearHideTimer, recordPresence]);

  useEffect(() => {
    if (!attendanceId) {
      clearHideTimer();
      return;
    }
    const onVisibility = () => {
      if (document.hidden) onTabHidden();
      else onTabVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onTabHidden);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onTabHidden);
      clearHideTimer();
    };
  }, [attendanceId, clearHideTimer, onTabHidden, onTabVisible]);

  async function startAttendance() {
    setError("");
    setTabStopped(false);
    try {
      const a = await api<AttendanceSession>(paths.clockIn, { method: "POST" });
      setAttendanceId(a.id);
      setBreakId("");
      setMsg(`Attendance started (${a.id})`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function endAttendanceManual() {
    try {
      await endAttendance("manual");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function startBreak() {
    if (!attendanceId) return;
    setError("");
    try {
      const b = await api<BreakSession>(paths.break(attendanceId), { method: "POST" });
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
      await api(paths.endBreak(breakId), { method: "POST" });
      setMsg("Break ended");
      setBreakId("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  let status: SmartAttendanceStatus = "idle";
  if (attendanceId) {
    if (awaySecondsLeft != null) status = "away_warning";
    else if (breakId) status = "on_break";
    else status = "on_clock";
  } else if (tabStopped) {
    status = "stopped_tab";
  }

  return {
    attendanceId,
    breakId,
    status,
    awaySecondsLeft,
    msg,
    error,
    hydrated,
    startAttendance,
    endAttendance: endAttendanceManual,
    startBreak,
    endBreak,
  };
}
