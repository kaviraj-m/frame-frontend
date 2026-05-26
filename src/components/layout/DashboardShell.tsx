import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAuthStorage } from "@/lib/api";
import { endAttendanceOnLogout } from "@/hooks/useAttendanceTracker";
import type { AttendanceApiPrefix } from "@/lib/attendanceTypes";

export type ShellNavItem = { to: string; label: string; end?: boolean };
export type ShellNavSection = { heading: string; items: ShellNavItem[] };

export function DashboardShell({
  title,
  subtitle = "Day-to-day orders and customer work",
  children,
  navSections,
  navItems = [],
  hideTopbar = false,
  attendanceApiPrefix,
}: {
  title: string;
  subtitle?: string;
  hideTopbar?: boolean;
  children: ReactNode;
  navSections?: ShellNavSection[];
  navItems?: ShellNavItem[];
  /** Ends open attendance session on logout (executive/designer). */
  attendanceApiPrefix?: AttendanceApiPrefix;
}) {
  const navigate = useNavigate();
  const username = typeof localStorage !== "undefined" ? localStorage.getItem("username") : null;
  const role = typeof localStorage !== "undefined" ? localStorage.getItem("role") : null;

  const sections: ShellNavSection[] =
    navSections && navSections.length > 0
      ? navSections
      : navItems.length > 0
        ? [{ heading: "Menu", items: navItems }]
        : [];

  async function logout() {
    if (attendanceApiPrefix) {
      await endAttendanceOnLogout(attendanceApiPrefix);
    }
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <div
      className={cn(
        "mx-auto flex h-[100dvh] w-full max-w-[1920px] flex-col overflow-hidden bg-background",
        "lg:flex-row",
      )}
    >
      <aside
        className={cn(
          "flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar px-4 py-5",
          "lg:h-full lg:w-[260px] lg:min-h-0 lg:border-b-0 lg:border-r",
        )}
      >
        <div className="mb-4 shrink-0 border-b border-sidebar-border pb-4">
          <BrandMark variant="sidebar" />
        </div>

        <div className="mb-4 shrink-0 px-2">
          <p className="text-sm font-medium text-sidebar-foreground">{username || "User"}</p>
          {role ? (
            <span className="mt-2 inline-block rounded border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
              {role}
            </span>
          ) : null}
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain"
          aria-label="Primary"
        >
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="mb-1.5 px-2 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                {section.heading}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end ?? false}
                      className={({ isActive }) =>
                        cn(
                          "block rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-accent/50",
                          isActive && "bg-accent/40 font-medium text-accent-foreground",
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 shrink-0 border-t border-sidebar-border pt-4">
          <Button type="button" variant="ghost" className="w-full" onClick={logout}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
        <div className="flex shrink-0 items-center justify-end border-b border-border bg-background px-4 py-2 sm:px-6">
          <ThemePicker />
        </div>
        {!hideTopbar ? (
          <header className="shrink-0 border-b border-border bg-background px-6 py-5">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </header>
        ) : null}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="p-6 pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
