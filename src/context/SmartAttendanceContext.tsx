import { createContext, useContext, type ReactNode } from "react";
import { useAttendanceTracker, type AttendanceTrackerState } from "@/hooks/useAttendanceTracker";
import type { AttendanceApiPrefix } from "@/lib/attendanceTypes";

const AttendanceContext = createContext<AttendanceTrackerState | null>(null);

export function SmartAttendanceProvider({
  apiPrefix,
  children,
}: {
  apiPrefix: AttendanceApiPrefix;
  children: ReactNode;
}) {
  const value = useAttendanceTracker(apiPrefix);
  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useSmartAttendanceContext(): AttendanceTrackerState {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error("useSmartAttendanceContext must be used within SmartAttendanceProvider");
  }
  return ctx;
}
