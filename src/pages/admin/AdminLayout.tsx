import { Outlet } from "react-router-dom";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";

const navSections: ShellNavSection[] = [
  {
    heading: "Team",
    items: [{ to: "/admin/users", label: "User management", end: true }],
  },
  {
    heading: "Configuration",
    items: [{ to: "/admin/pricing", label: "Pricing", end: true }],
  },
  {
    heading: "Customer comms",
    items: [{ to: "/admin/whatsapp-draft", label: "WhatsApp draft", end: true }],
  },
  {
    heading: "Operations",
    items: [
      { to: "/admin/orders", label: "All orders", end: true },
      { to: "/admin/orders/production", label: "Production & dispatch", end: true },
      { to: "/admin/orders/patch", label: "Update order", end: true },
      { to: "/admin/reports/attendance", label: "Attendance report", end: true },
    ],
  },
];

export function AdminLayout() {
  return (
    <DashboardShell
      title="Admin"
      subtitle="People, pricing, and order controls"
      navSections={navSections}
      hideTopbar
    >
      <div className="admin-app">
        <Outlet />
      </div>
    </DashboardShell>
  );
}
