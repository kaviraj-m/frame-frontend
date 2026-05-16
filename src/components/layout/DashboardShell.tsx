import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../lib/api";

export type ShellNavItem = { to: string; label: string; end?: boolean };
export type ShellNavSection = { heading: string; items: ShellNavItem[] };

export function DashboardShell({
  title,
  subtitle = "Day-to-day orders and customer work",
  children,
  navSections,
  navItems = [],
  hideTopbar = false,
}: {
  title: string;
  subtitle?: string;
  /** Hide the title strip above content for dense table-first pages. */
  hideTopbar?: boolean;
  children: ReactNode;
  /** Grouped navigation (preferred). */
  navSections?: ShellNavSection[];
  /** Flat list — wrapped in a single "Menu" section if `navSections` is omitted. */
  navItems?: ShellNavItem[];
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

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand__mark">K</div>
          <div className="shell-brand__text">
            <span className="shell-brand__name">KaspX</span>
            <span className="shell-brand__tag">Order management</span>
          </div>
        </div>

        <div className="shell-user">
          <div className="shell-user__meta">
            <span className="shell-user__name">{username || "User"}</span>
            {role && <span className="shell-role">{role}</span>}
          </div>
        </div>

        <nav className="shell-nav" aria-label="Primary">
          {sections.map((section) => (
            <div key={section.heading} className="shell-nav__group">
              <div className="shell-nav__heading">{section.heading}</div>
              <ul className="shell-nav__list">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end ?? false}
                      className={({ isActive }) => `shell-nav__link${isActive ? " is-active" : ""}`}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shell-footer">
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className={`shell-main${hideTopbar ? " shell-main--no-topbar" : ""}`}>
        {!hideTopbar ? (
          <header className="shell-topbar">
            <div>
              <h1 className="shell-topbar__title">{title}</h1>
              <p className="shell-topbar__subtitle">{subtitle}</p>
            </div>
          </header>
        ) : null}
        <div className="shell-content">{children}</div>
      </div>
    </div>
  );
}
