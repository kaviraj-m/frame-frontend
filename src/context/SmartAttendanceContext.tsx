import { createContext, useContext, type ReactNode } from "react";
import { useSmartAttendance, type SmartAttendanceState } from "../hooks/useSmartAttendance";
import type { AttendanceApiPrefix } from "../lib/attendanceTypes";

const SmartAttendanceContext = createContext<SmartAttendanceState | null>(null);

export function SmartAttendanceProvider({
  apiPrefix,
  children,
}: {
  apiPrefix: AttendanceApiPrefix;
  children: ReactNode;
}) {
  const value = useSmartAttendance(apiPrefix);
  return <SmartAttendanceContext.Provider value={value}>{children}</SmartAttendanceContext.Provider>;
}

export function useSmartAttendanceContext(): SmartAttendanceState {
  const ctx = useContext(SmartAttendanceContext);
  if (!ctx) {
    throw new Error("useSmartAttendanceContext must be used within SmartAttendanceProvider");
  }
  return ctx;
}
