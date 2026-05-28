import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { API_BASE } from "@/lib/api/config";
import {
  attendancePaths,
  PRESENT_HEARTBEAT_MS,
  PRESENT_OFFLINE_AFTER_MS,
} from "@/lib/attendanceApi";
import { apiPaths } from "@/lib/apiPaths";
import type {
  AttendanceApiPrefix,
  AttendanceCurrentPayload,
  AttendanceEndReason,
  AttendanceSession,
  BreakSession,
} from "@/lib/attendanceTypes";

export type AttendanceTrackerStatus = "offline" | "present" | "break";

function isSessionInactive(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() > PRESENT_OFFLINE_AFTER_MS;
}

export type AttendanceTrackerState = {
  attendanceId: string;
  breakId: string;
  status: AttendanceTrackerStatus;
  /** True when tab/app is away but session is still open (heartbeats paused). */
  isAway: boolean;
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
  const [isAway, setIsAway] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [inactiveTick, setInactiveTick] = useState(0);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const attendanceIdRef = useRef("");
  const breakIdRef = useRef("");
  const tabAwaySinceRef = useRef<number | null>(null);
  const presenceSentForAwayRef = useRef(false);
  const handlersRef = useRef<TrackerHandlers>({
    onTabHidden: () => {},
    onTabVisible: () => {},
  });

  const applyCurrent = useCallback((cur: AttendanceCurrentPayload) => {
    if (!cur.attendance) {
      setAttendanceId("");
      setBreakId("");
      setLastSeenAt(null);
      attendanceIdRef.current = "";
      breakIdRef.current = "";
      return;
    }
    const att = cur.attendance.id;
    const brk = cur.activeBreak?.id ?? "";
    setAttendanceId(att);
    setBreakId(brk);
    setLastSeenAt(cur.attendance.lastSeenAt ?? null);
    attendanceIdRef.current = att;
    breakIdRef.current = brk;
  }, []);

  const syncFromServer = useCallback(async () => {
    const cur = await api<AttendanceCurrentPayload>(paths.current);
    applyCurrent(cur);
    return cur;
  }, [applyCurrent, paths.current]);

  const sendHeartbeat = useCallback(async () => {
    if (!attendanceIdRef.current) return;
    const cur = await api<AttendanceCurrentPayload>(paths.heartbeat, { method: "POST" });
    applyCurrent(cur);
    if (!cur.attendance) {
      tabAwaySinceRef.current = null;
      presenceSentForAwayRef.current = false;
      setIsAway(false);
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
            breakIdRef.current = "";
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
      tabAwaySinceRef.current = null;
      presenceSentForAwayRef.current = false;
      setIsAway(false);
      await api(paths.end(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setAttendanceId("");
      setBreakId("");
      attendanceIdRef.current = "";
      breakIdRef.current = "";
    },
    [paths],
  );

  const startBreakInternal = useCallback(async () => {
    const attId = attendanceIdRef.current;
    if (!attId || breakIdRef.current) return;
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

  const isAwayNow = useCallback(() => {
    if (typeof document === "undefined") return false;
    if (document.visibilityState === "hidden") return true;
    if (typeof document.hasFocus === "function" && !document.hasFocus()) return true;
    return false;
  }, []);

  const markAwayLocal = useCallback(() => {
    if (!attendanceIdRef.current) return;
    if (tabAwaySinceRef.current == null) {
      tabAwaySinceRef.current = Date.now();
    }
    setIsAway(true);
  }, []);

  const onTabHidden = useCallback(async () => {
    if (!attendanceIdRef.current) return;
    markAwayLocal();
    if (presenceSentForAwayRef.current) return;
    presenceSentForAwayRef.current = true;
    try {
      await recordPresence("tab_hidden");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [markAwayLocal, recordPresence]);

  const onTabVisible = useCallback(async () => {
    if (!attendanceIdRef.current) return;
    tabAwaySinceRef.current = null;
    presenceSentForAwayRef.current = false;
    setIsAway(false);
    try {
      await recordPresence("tab_visible");
      const cur = await syncFromServer();
      applyCurrent(cur);
      if (cur.attendance && !cur.activeBreak) {
        await sendHeartbeat();
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [applyCurrent, recordPresence, sendHeartbeat, syncFromServer]);

  handlersRef.current = { onTabHidden, onTabVisible };

  useEffect(() => {
    if (!attendanceId || !hydrated) return;

    if (!isAwayNow()) {
      void sendHeartbeat().catch((e) => setError((e as Error).message));
    } else {
      void onTabHidden();
    }

    const heartbeatTimer = window.setInterval(() => {
      if (!attendanceIdRef.current) return;
      if (isAwayNow()) return;
      if (breakIdRef.current) return;
      void sendHeartbeat().catch((e) => setError((e as Error).message));
    }, PRESENT_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [attendanceId, hydrated, isAwayNow, onTabHidden, sendHeartbeat]);

  useEffect(() => {
    if (!attendanceId || !hydrated) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void handlersRef.current.onTabHidden();
      } else {
        void handlersRef.current.onTabVisible();
      }
    };

    const onBlur = () => {
      window.setTimeout(() => {
        if (!attendanceIdRef.current) return;
        if (isAwayNow()) void handlersRef.current.onTabHidden();
      }, 100);
    };

    const onFocus = () => {
      if (!isAwayNow()) {
        void handlersRef.current.onTabVisible();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    if (isAwayNow()) {
      void handlersRef.current.onTabHidden();
    } else {
      setIsAway(false);
    }

    const watchdog = window.setInterval(() => {
      if (!attendanceIdRef.current) return;
      if (!isAwayNow()) {
        if (tabAwaySinceRef.current != null) {
          tabAwaySinceRef.current = null;
          setIsAway(false);
        }
        return;
      }
      markAwayLocal();
    }, 1500);

    const onBeforeUnload = () => {
      const id = attendanceIdRef.current;
      if (!id) return;
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
  }, [attendanceId, hydrated, isAwayNow, markAwayLocal, paths]);

  useEffect(() => {
    if (!attendanceId) return;
    const timer = window.setInterval(() => {
      setInactiveTick((n) => n + 1);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [attendanceId, lastSeenAt]);

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

  void inactiveTick;

  let status: AttendanceTrackerStatus = "offline";
  if (attendanceId) {
    if (breakId) status = "break";
    else if (isSessionInactive(lastSeenAt)) status = "offline";
    else status = "present";
  }

  return {
    attendanceId,
    breakId,
    status,
    isAway,
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
    await api(paths.end(cur.attendance.id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "logout" }),
    });
  } catch {
    // logout proceeds anyway
  }
}
