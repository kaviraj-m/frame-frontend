import { Outlet } from "react-router-dom";
import { SmartAttendanceBanner } from "../../components/SmartAttendanceBanner";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";
import { SmartAttendanceProvider } from "../../context/SmartAttendanceContext";

const navSections: ShellNavSection[] = [
  {
    heading: "Design",
    items: [{ to: "/designer/queue", label: "Queue", end: true }],
  },
  {
    heading: "Time & attendance",
    items: [{ to: "/designer/attendance", label: "Attendance", end: true }],
  },
];

export function DesignerLayout() {
  return (
    <DashboardShell
      title="Designer"
      subtitle="Work queue, previews, and sign-off"
      navSections={navSections}
      hideTopbar
    >
      <SmartAttendanceProvider apiPrefix="/api/designer">
        <div className="executive-app">
          <SmartAttendanceBanner />
          <Outlet />
        </div>
      </SmartAttendanceProvider>
    </DashboardShell>
  );
}
