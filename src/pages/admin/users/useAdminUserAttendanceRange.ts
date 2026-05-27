import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { todayISTDateString } from "@/lib/attendanceIst";
import type { UserAttendanceRangeResponse } from "@/lib/attendanceTypes";
import type { AdminUserRow } from "./adminUserTypes";

function istDateDaysAgo(days: number): string {
  const end = todayISTDateString();
  const [y, m, d] = end.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - (days - 1));
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

const TRACKED_ROLES = new Set(["EXECUTIVE", "DESIGNER"]);

export function useAdminUserAttendanceRange() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [userId, setUserId] = useState(() => searchParams.get("userId") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? istDateDaysAgo(30));
  const [to, setTo] = useState(() => searchParams.get("to") ?? todayISTDateString());
  const [data, setData] = useState<UserAttendanceRangeResponse | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const trackedUsers = users.filter((u) => TRACKED_ROLES.has(u.role) && u.isActive);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const list = await api<AdminUserRow[]>(apiPaths.adminUsers);
      setUsers(list);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const initialUserId = searchParams.get("userId") ?? "";
  const didAutoLoad = useRef(false);

  const loadRange = useCallback(async () => {
    if (!userId.trim()) {
      setErr("Select a user.");
      setData(null);
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const out = await api<UserAttendanceRangeResponse>(
        apiPaths.adminAttendanceUserRange(userId, from, to),
      );
      setData({
        ...out,
        daily: out.daily ?? [],
      });
      const next = new URLSearchParams(searchParams);
      next.set("userId", userId);
      next.set("from", from);
      next.set("to", to);
      setSearchParams(next, { replace: true });
    } catch (e) {
      setErr((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, from, to, searchParams, setSearchParams]);

  useEffect(() => {
    if (didAutoLoad.current || loadingUsers) return;
    if (initialUserId.trim() && userId === initialUserId) {
      didAutoLoad.current = true;
      void loadRange();
    }
  }, [loadingUsers, initialUserId, userId, loadRange]);

  const applyPreset = useCallback((days: number) => {
    setTo(todayISTDateString());
    setFrom(istDateDaysAgo(days));
  }, []);

  return {
    users: trackedUsers,
    userId,
    setUserId,
    from,
    setFrom,
    to,
    setTo,
    data,
    loadingUsers,
    loading,
    err,
    loadRange,
    applyPreset,
    loadUsers,
  };
}
