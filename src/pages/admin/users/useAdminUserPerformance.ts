import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { todayISTDateString } from "@/lib/attendanceIst";
import type {
  AdminUserDetail,
  UserPerformanceDayDetail,
  UserPerformanceResponse,
} from "./adminUserPerformanceTypes";

function istDateDaysAgo(days: number): string {
  const end = todayISTDateString();
  const [y, m, d] = end.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - (days - 1));
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export function useAdminUserPerformance(userId: string | undefined) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [from, setFrom] = useState(() => istDateDaysAgo(30));
  const [to, setTo] = useState(() => todayISTDateString());
  const [performance, setPerformance] = useState<UserPerformanceResponse | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<UserPerformanceDayDetail | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [err, setErr] = useState("");

  const isExecutive = user?.role === "EXECUTIVE";

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setErr("");
    setLoadingUser(true);
    try {
      const u = await api<AdminUserDetail>(apiPaths.adminUser(userId));
      setUser(u);
    } catch (e) {
      setErr((e as Error).message);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  const loadPerformance = useCallback(async () => {
    if (!userId || !isExecutive) {
      setPerformance(null);
      return;
    }
    setErr("");
    setLoadingPerf(true);
    setExpandedDate(null);
    setDayDetail(null);
    try {
      const out = await api<UserPerformanceResponse>(
        apiPaths.adminUserPerformance(userId, from, to),
      );
      setPerformance(out);
      setUser(out.user);
    } catch (e) {
      setErr((e as Error).message);
      setPerformance(null);
    } finally {
      setLoadingPerf(false);
    }
  }, [userId, from, to, isExecutive]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!loadingUser && isExecutive) {
      void loadPerformance();
    }
  }, [loadingUser, isExecutive, loadPerformance]);

  const applyPreset = useCallback((days: number) => {
    setTo(todayISTDateString());
    setFrom(istDateDaysAgo(days));
  }, []);

  const toggleDay = useCallback(
    async (date: string) => {
      if (!userId) return;
      if (expandedDate === date) {
        setExpandedDate(null);
        setDayDetail(null);
        return;
      }
      setExpandedDate(date);
      setLoadingDay(true);
      setDayDetail(null);
      setErr("");
      try {
        const out = await api<UserPerformanceDayDetail>(
          apiPaths.adminUserPerformanceDay(userId, date),
        );
        setDayDetail({
          ...out,
          createdOrders: out.createdOrders ?? [],
          completedOrders: out.completedOrders ?? [],
          createdQueries: out.createdQueries ?? [],
        });
      } catch (e) {
        setErr((e as Error).message);
        setExpandedDate(null);
      } finally {
        setLoadingDay(false);
      }
    },
    [userId, expandedDate],
  );

  return {
    user,
    from,
    setFrom,
    to,
    setTo,
    performance,
    expandedDate,
    dayDetail,
    loadingUser,
    loadingPerf,
    loadingDay,
    err,
    isExecutive,
    loadUser,
    loadPerformance,
    applyPreset,
    toggleDay,
  };
}
