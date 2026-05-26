import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { todayISTDateString } from "@/lib/attendanceIst";
import type { AdminAnalyticsOverview } from "./adminAnalyticsTypes";

function istDateDaysAgo(days: number): string {
  const end = todayISTDateString();
  const [y, m, d] = end.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - (days - 1));
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export function useAdminAnalytics() {
  const [from, setFrom] = useState(() => istDateDaysAgo(30));
  const [to, setTo] = useState(() => todayISTDateString());
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const out = await api<AdminAnalyticsOverview>(apiPaths.adminAnalyticsOverview(from, to));
      setData(out);
    } catch (e) {
      setErr((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = useCallback((days: number) => {
    setTo(todayISTDateString());
    setFrom(istDateDaysAgo(days));
  }, []);

  return {
    from,
    setFrom,
    to,
    setTo,
    data,
    loading,
    err,
    load,
    applyPreset,
  };
}
