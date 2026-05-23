import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { API_BASE } from "@/lib/api/config";
import { attendancePaths, AWAY_GRACE_MS } from "@/lib/attendanceApi";
import type {
  AttendanceApiPrefix,
  AttendanceCurrentPayload,
  AttendanceEndReason,
  AttendanceSession,
  BreakSession,
} from "@/lib/attendanceTypes";

export type AttendanceTrackerStatus =
  | "offline"
  | "present"
  | "break"
  | "away_pending";

export type AttendanceTrackerState = {
  attendanceId: string;
  breakId: string;
  status: AttendanceTrackerStatus;
  awaySecondsLeft: number | null;
  error: string;
  hydrated: boolean;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  endDay: () => Promise<void>;
};

function isPageAway(): boolean {
  return document.hidden || !document.hasFocus();
}

export function useAttendanceTracker(apiPrefix: AttendanceApiPrefix): AttendanceTrackerState {
  const paths = attendancePaths(apiPrefix);
  const [attendanceId, setAttendanceId] = useState("");
  const [breakId, setBreakId] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [awaySecondsLeft, setAwaySecondsLeft] = useState<number | null>(null);

  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const awayStartedAtRef = useRef<number | null>(null);
  const autoBreakRef = useRef(false);
  const attendanceIdRef = useRef("");
  const breakIdRef = useRef("");

  useEffect(() => {
    attendanceIdRef.current = attendanceId;
  }, [attendanceId]);
  useEffect(() => {
    breakIdRef.current = breakId;
  }, [breakId]);

  const clearAwayTimer = useCallback(() => {
    if (awayTimerRef.current) {
      clearTimeout(awayTimerRef.current);
      awayTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    awayStartedAtRef.current = null;
    setAwaySecondsLeft(null);
  }, []);

  const applyCurrent = useCallback((cur: AttendanceCurrentPayload) => {
    if (cur.attendance) {
      setAttendanceId(cur.attendance.id);
      setBreakId(cur.activeBreak?.id ?? "");
      autoBreakRef.current = false;
    } else {
      setAttendanceId("");
      setBreakId("");
      autoBreakRef.current = false;
    }
  }, []);

  const syncFromServer = useCallback(async () => {
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    applyCurrent(cur);
    return cur;
  }, [applyCurrent, paths.current]);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setError("");
    (async () => {
      try {
        const cur = await syncFromServer();
        if (cancelled) return;
        if (!cur.attendance) {
          const a = await api<AttendanceSession>(paths.clockIn, { method: "POST" });
          if (!cancelled) {
            setAttendanceId(a.id);
            setBreakId("");
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paths.clockIn, syncFromServer]);

  const recordPresence = useCallback(
    async (event: "tab_hidden" | "tab_visible") => {
      if (!attendanceIdRef.current) return;
      try {
        await api(paths.presence, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event }),
        });
      } catch {
        // audit only
      }
    },
    [paths.presence],
  );

  const endAttendance = useCallback(
    async (reason: AttendanceEndReason) => {
      const id = attendanceIdRef.current;
      if (!id) return;
      clearAwayTimer();
      await api(paths.end(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setAttendanceId("");
      setBreakId("");
      autoBreakRef.current = false;
    },
    [clearAwayTimer, paths],
  );

  const startBreakInternal = useCallback(
    async (source: "manual" | "auto_away") => {
      const attId = attendanceIdRef.current;
      if (!attId || breakIdRef.current) return;
      setError("");
      const b = await api<BreakSession>(paths.break(attId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      setBreakId(b.id);
      autoBreakRef.current = source === "auto_away";
    },
    [paths],
  );

  const endBreakInternal = useCallback(async () => {
    const id = breakIdRef.current;
    if (!id) return;
    setError("");
    await api(paths.endBreak(id), { method: "POST" });
    setBreakId("");
    autoBreakRef.current = false;
  }, [paths]);

  const onAway = useCallback(() => {
    if (!attendanceIdRef.current || breakIdRef.current) return;
    void recordPresence("tab_hidden");
    clearAwayTimer();
    awayStartedAtRef.current = Date.now();
    setAwaySecondsLeft(Math.ceil(AWAY_GRACE_MS / 1000));
    tickRef.current = setInterval(() => {
      if (awayStartedAtRef.current == null) return;
      const left = Math.max(0, AWAY_GRACE_MS - (Date.now() - awayStartedAtRef.current));
      setAwaySecondsLeft(Math.ceil(left / 1000));
    }, 400);
    awayTimerRef.current = setTimeout(() => {
      void startBreakInternal("auto_away").catch((e) => setError((e as Error).message));
      clearAwayTimer();
    }, AWAY_GRACE_MS);
  }, [clearAwayTimer, recordPresence, startBreakInternal]);

  const onActive = useCallback(() => {
    if (!attendanceIdRef.current) return;
    clearAwayTimer();
    void recordPresence("tab_visible");
    if (autoBreakRef.current && breakIdRef.current) {
      void endBreakInternal().catch((e) => setError((e as Error).message));
    }
  }, [clearAwayTimer, endBreakInternal, recordPresence]);

  useEffect(() => {
    if (!attendanceId || !hydrated) {
      clearAwayTimer();
      return;
    }
    if (isPageAway()) {
      onAway();
    }
    const check = () => {
      if (isPageAway()) onAway();
      else onActive();
    };
    const onVisibility = () => check();
    const onBlur = () => {
      if (isPageAway()) onAway();
    };
    const onFocus = () => onActive();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const onPageHide = () => {
      const id = attendanceIdRef.current;
      if (!id) return;
      const token = localStorage.getItem("token");
      const url = `${API_BASE}${paths.end(id)}`;
      const body = JSON.stringify({ reason: "page_leave" });
      try {
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
          keepalive: true,
        });
      } catch {
        // best effort
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
      clearAwayTimer();
    };
  }, [attendanceId, hydrated, clearAwayTimer, onActive, onAway, paths]);

  async function startBreak() {
    try {
      await startBreakInternal("manual");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function endBreak() {
    try {
      await endBreakInternal();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function endDay() {
    try {
      await endAttendance("manual");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  let status: AttendanceTrackerStatus = "offline";
  if (attendanceId) {
    if (awaySecondsLeft != null) status = "away_pending";
    else if (breakId) status = "break";
    else status = "present";
  }

  return {
    attendanceId,
    breakId,
    status,
    awaySecondsLeft,
    error,
    hydrated,
    startBreak,
    endBreak,
    endDay,
  };
}

/** Call before clearing auth on logout. */
export async function endAttendanceOnLogout(apiPrefix: AttendanceApiPrefix): Promise<void> {
  const paths = attendancePaths(apiPrefix);
  try {
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    if (!cur.attendance?.id) return;
    await api(paths.end(cur.attendance.id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "logout" }),
    });
  } catch {
    // logout proceeds anyway
  }
}
