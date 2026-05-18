import { Outlet } from "react-router-dom";
import { SmartAttendanceBanner } from "../../components/SmartAttendanceBanner";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";
import { SmartAttendanceProvider } from "../../context/SmartAttendanceContext";

const navSections: ShellNavSection[] = [
  {
    heading: "Customers & orders",
    items: [
      { to: "/executive/queries", label: "Queries", end: true },
      { to: "/executive/queries/new", label: "New query", end: true },
      { to: "/executive/orders", label: "Orders", end: true },
    ],
  },
  {
    heading: "Time & attendance",
    items: [{ to: "/executive/attendance", label: "Attendance", end: true }],
  },
];

export function ExecutiveLayout() {
  return (
    <DashboardShell
      title="Executive"
      subtitle="Queries, confirmations, and print-ready files"
      navSections={navSections}
      hideTopbar
    >
      <SmartAttendanceProvider apiPrefix="/api/executive">
        <div className="executive-app">
          <SmartAttendanceBanner />
          <Outlet />
        </div>
      </SmartAttendanceProvider>
    </DashboardShell>
  );
}
