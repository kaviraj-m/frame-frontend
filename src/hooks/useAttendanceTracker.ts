import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { API_BASE } from "@/lib/api/config";
import { attendancePaths, PRESENT_HEARTBEAT_MS } from "@/lib/attendanceApi";
import { apiPaths } from "@/lib/apiPaths";
import type {
  AttendanceApiPrefix,
  AttendanceCurrentPayload,
  AttendanceEndReason,
  AttendanceSession,
  BreakSession,
  IdleSession,
} from "@/lib/attendanceTypes";

export type AttendanceTrackerStatus = "offline" | "present" | "break" | "idle";

export type AttendanceTrackerState = {
  attendanceId: string;
  breakId: string;
  idleId: string;
  status: AttendanceTrackerStatus;
  awaySecondsLeft: number | null;
  error: string;
  hydrated: boolean;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  endDay: () => Promise<void>;
};

/** Fire-and-forget POST while tab is closing (attendance end only). */
function postKeepalive(path: string, body: string) {
  const token = localStorage.getItem("token");
  try {
    fetch(`${API_BASE}${path}`, {
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
}

type TrackerHandlers = {
  onTabHidden: () => void;
  onTabVisible: () => void;
};

export function useAttendanceTracker(apiPrefix: AttendanceApiPrefix): AttendanceTrackerState {
  const paths = attendancePaths(apiPrefix);
  const [attendanceId, setAttendanceId] = useState("");
  const [breakId, setBreakId] = useState("");
  const [idleId, setIdleId] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const attendanceIdRef = useRef("");
  const breakIdRef = useRef("");
  const idleIdRef = useRef("");
  const tabAwaySinceRef = useRef<number | null>(null);
  const idleStartInFlightRef = useRef(false);
  const handlersRef = useRef<TrackerHandlers>({
    onTabHidden: () => {},
    onTabVisible: () => {},
  });

  const applyCurrent = useCallback((cur: AttendanceCurrentPayload) => {
    if (!cur.attendance) {
      setAttendanceId("");
      setBreakId("");
      setIdleId("");
      attendanceIdRef.current = "";
      breakIdRef.current = "";
      idleIdRef.current = "";
      return;
    }
    const att = cur.attendance.id;
    const brk = cur.activeBreak?.id ?? "";
    const idl = cur.activeIdle?.id ?? "";
    setAttendanceId(att);
    setBreakId(brk);
    setIdleId(idl);
    attendanceIdRef.current = att;
    breakIdRef.current = brk;
    idleIdRef.current = idl;
  }, []);

  const syncFromServer = useCallback(async () => {
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    applyCurrent(cur);
    return cur;
  }, [applyCurrent, paths.current]);

  const sendHeartbeat = useCallback(async () => {
    if (!attendanceIdRef.current || idleIdRef.current) return;
    const cur = await api<AttendanceCurrentPayload>(paths.heartbeat, { method: "POST" });
    applyCurrent(cur);
    if (!cur.attendance) {
      tabAwaySinceRef.current = null;
    }
    return cur;
  }, [applyCurrent, paths.heartbeat]);

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
            attendanceIdRef.current = a.id;
            setBreakId("");
            setIdleId("");
            breakIdRef.current = "";
            idleIdRef.current = "";
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

  const startIdleInternal = useCallback(async () => {
    const attId = attendanceIdRef.current;
    if (!attId || breakIdRef.current || idleIdRef.current) return;
    if (idleStartInFlightRef.current) return;
    idleStartInFlightRef.current = true;
    try {
      const idle = await api<IdleSession>(paths.idle(attId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "tab_away" }),
      });
      idleIdRef.current = idle.id;
      setIdleId(idle.id);
      setError("");
    } finally {
      idleStartInFlightRef.current = false;
    }
  }, [paths]);

  const endIdleInternal = useCallback(async () => {
    const id = idleIdRef.current;
    if (!id) return;
    await api(paths.endIdle(id), { method: "POST" });
    idleIdRef.current = "";
    setIdleId("");
  }, [paths]);

  const endAttendance = useCallback(
    async (reason: AttendanceEndReason) => {
      const id = attendanceIdRef.current;
      if (!id) return;
      tabAwaySinceRef.current = null;
      if (idleIdRef.current) {
        try {
          await api(paths.endIdle(idleIdRef.current), { method: "POST" });
        } catch {
          // continue ending day
        }
        idleIdRef.current = "";
        setIdleId("");
      }
      await api(paths.end(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setAttendanceId("");
      setBreakId("");
      setIdleId("");
      attendanceIdRef.current = "";
      breakIdRef.current = "";
      idleIdRef.current = "";
    },
    [paths],
  );

  const startBreakInternal = useCallback(async () => {
    const attId = attendanceIdRef.current;
    if (!attId || breakIdRef.current || idleIdRef.current) return;
    setError("");
    const b = await api<BreakSession>(paths.break(attId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "manual" }),
    });
    breakIdRef.current = b.id;
    setBreakId(b.id);
  }, [paths]);

  const endBreakInternal = useCallback(async () => {
    const id = breakIdRef.current;
    if (!id) return;
    setError("");
    await api(paths.endBreak(id), { method: "POST" });
    breakIdRef.current = "";
    setBreakId("");
  }, [paths]);

  const isAway = useCallback(() => {
    return document.visibilityState === "hidden" || !document.hasFocus();
  }, []);

  const onTabHidden = useCallback(() => {
    if (!attendanceIdRef.current || breakIdRef.current) return;
    if (tabAwaySinceRef.current == null) {
      tabAwaySinceRef.current = Date.now();
    }
    void recordPresence("tab_hidden");
    if (!idleIdRef.current) {
      void startIdleInternal().catch((e) => setError((e as Error).message));
    }
  }, [recordPresence, startIdleInternal]);

  const onTabVisible = useCallback(async () => {
    if (!attendanceIdRef.current) return;
    tabAwaySinceRef.current = null;
    void recordPresence("tab_visible");
    try {
      if (idleIdRef.current) {
        await endIdleInternal();
      }
      await sendHeartbeat();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [endIdleInternal, recordPresence, sendHeartbeat]);

  handlersRef.current = { onTabHidden, onTabVisible };

  useEffect(() => {
    if (!attendanceId || !hydrated || idleId) return;

    void sendHeartbeat().catch((e) => setError((e as Error).message));

    const heartbeatTimer = window.setInterval(() => {
      if (!attendanceIdRef.current || idleIdRef.current || isAway()) return;
      void sendHeartbeat().catch((e) => setError((e as Error).message));
    }, PRESENT_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [attendanceId, hydrated, idleId, isAway, sendHeartbeat]);

  useEffect(() => {
    if (!attendanceId || !hydrated) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        handlersRef.current.onTabHidden();
      } else {
        void handlersRef.current.onTabVisible();
      }
    };

    const onBlur = () => {
      window.setTimeout(() => {
        if (!attendanceIdRef.current || breakIdRef.current) return;
        if (isAway()) handlersRef.current.onTabHidden();
      }, 200);
    };

    const onFocus = () => {
      if (!isAway()) {
        void handlersRef.current.onTabVisible();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    if (isAway()) {
      handlersRef.current.onTabHidden();
    }

    const watchdog = window.setInterval(() => {
      if (!attendanceIdRef.current || breakIdRef.current || idleIdRef.current) return;
      if (!isAway()) return;
      if (tabAwaySinceRef.current == null) {
        tabAwaySinceRef.current = Date.now();
      }
      handlersRef.current.onTabHidden();
    }, 2000);

    const onBeforeUnload = () => {
      const id = attendanceIdRef.current;
      if (!id) return;
      if (idleIdRef.current) {
        postKeepalive(paths.endIdle(idleIdRef.current), "{}");
      }
      postKeepalive(paths.end(id), JSON.stringify({ reason: "page_leave" }));
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(watchdog);
    };
  }, [attendanceId, hydrated, isAway, paths]);

  async function startBreak() {
    try {
      await startBreakInternal();
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
    if (breakId) status = "break";
    else if (idleId) status = "idle";
    else status = "present";
  }

  return {
    attendanceId,
    breakId,
    idleId,
    status,
    awaySecondsLeft: null,
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
    const refreshToken = localStorage.getItem("refreshToken");
    await api(apiPaths.authLogout, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    if (!cur.attendance?.id) return;
    if (cur.activeIdle?.id) {
      await api(paths.endIdle(cur.activeIdle.id), { method: "POST" }).catch(() => {});
    }
    await api(paths.end(cur.attendance.id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "logout" }),
    });
  } catch {
    // logout proceeds anyway
  }
}
