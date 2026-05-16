import { Outlet } from "react-router-dom";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";

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
      <Outlet />
    </DashboardShell>
  );
}
