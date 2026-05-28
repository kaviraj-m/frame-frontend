import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { AttendanceStatusChip } from "../../components/AttendanceStatusChip";
import { DashboardShell } from "../../components/layout/DashboardShell";
import type { ShellNavSection } from "../../components/layout/DashboardShell";
import { SmartAttendanceProvider } from "../../context/SmartAttendanceContext";
import { useExecutiveProductionDispatch } from "@/hooks/useExecutiveProductionDispatch";

const baseNavSections: ShellNavSection[] = [
  {
    heading: "Customers & orders",
    items: [
      { to: "/executive/queries", label: "Queries", end: true },
      { to: "/executive/queries/new", label: "New query", end: true },
      { to: "/executive/orders", label: "Orders", end: true },
      { to: "/executive/orders/all", label: "All orders", end: true },
      { to: "/executive/queries/all", label: "All queries", end: true },
    ],
  },
  {
    heading: "Time & attendance",
    items: [{ to: "/executive/attendance", label: "Attendance", end: true }],
  },
];

export function ExecutiveLayout() {
  const { enabled: productionDispatchEnabled } = useExecutiveProductionDispatch();

  const navSections = useMemo(() => {
    if (!productionDispatchEnabled) return baseNavSections;
    const sections = baseNavSections.map((s) => ({ ...s, items: [...s.items] }));
    const ordersSection = sections.find((s) => s.heading === "Customers & orders");
    if (ordersSection) {
      ordersSection.items.push({
        to: "/executive/orders/production",
        label: "Production & dispatch",
        end: true,
      });
    }
    return sections;
  }, [productionDispatchEnabled]);

  return (
    <DashboardShell
      title="Executive"
      subtitle="Queries, confirmations, and print-ready files"
      navSections={navSections}
      hideTopbar
      attendanceApiPrefix="/api/executive"
    >
      <SmartAttendanceProvider apiPrefix="/api/executive">
        <>
          <AttendanceStatusChip />
          <Outlet />
        </>
      </SmartAttendanceProvider>
    </DashboardShell>
  );
}
