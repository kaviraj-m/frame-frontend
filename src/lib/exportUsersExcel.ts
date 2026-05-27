import * as XLSX from "xlsx";
import type { AdminUserRow } from "@/pages/admin/users/adminUserTypes";

export type UserExportRow = {
  Username: string;
  Email: string;
  Role: string;
  Status: string;
  "User ID": string;
};

export function rowsToUserExportSheetData(users: AdminUserRow[]): UserExportRow[] {
  return users.map((u) => ({
    Username: u.username?.trim() || "",
    Email: u.email?.trim() || "",
    Role: u.role?.trim() || "",
    Status: u.isActive ? "Active" : "Inactive",
    "User ID": u.id?.trim() || "",
  }));
}

function defaultExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `users-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

export function exportUsersToExcel(users: AdminUserRow[], filename?: string): void {
  if (users.length === 0) return;
  const data = rowsToUserExportSheetData(users);
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Users");
  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename());
}
