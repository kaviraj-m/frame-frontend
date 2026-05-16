import type { AttendanceApiPrefix } from "./attendanceTypes";

export function attendanceSessionStorageKey(apiPrefix: AttendanceApiPrefix): string {
  const uid = localStorage.getItem("userId") || "";
  return `kaspx_att_${uid}_${apiPrefix}`;
}
