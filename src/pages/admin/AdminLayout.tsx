import { Outlet } from "react-router-dom";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";

const navSections: ShellNavSection[] = [
  {
    heading: "Insights",
    items: [
      { to: "/admin/analytics", label: "Analytics", end: true },
      { to: "/admin/reports/attendance", label: "Attendance report", end: true },
    ],
  },
  {
    heading: "Team",
    items: [{ to: "/admin/users", label: "User management", end: false }],
  },
  {
    heading: "Configuration",
    items: [{ to: "/admin/pricing", label: "Pricing", end: true }],
  },
  {
    heading: "Settings",
    items: [
      { to: "/admin/settings/executive-features", label: "Executive features", end: true },
      { to: "/admin/settings/shipping-from", label: "From address", end: true },
    ],
  },
  {
    heading: "Customer comms",
    items: [{ to: "/admin/whatsapp-draft", label: "WhatsApp draft", end: true }],
  },
  {
    heading: "Operations",
    items: [
      { to: "/admin/orders", label: "All orders", end: true },
      { to: "/admin/queries", label: "All queries", end: true },
      { to: "/admin/orders/production", label: "Production & dispatch", end: true },
      { to: "/admin/orders/patch", label: "Update order", end: true },
      { to: "/admin/audit-log", label: "Audit log", end: true },
    ],
  },
];

export function AdminLayout() {
  return (
    <DashboardShell
      title="Admin"
      subtitle="Analytics, team, orders, and configuration"
      navSections={navSections}
      hideTopbar
    >
      <div className="admin-app">
        <Outlet />
      </div>
    </DashboardShell>
  );
}
