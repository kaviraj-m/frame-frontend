import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";

type UserRow = { id: string; username: string; role: string; isActive: boolean };

export function AdminUsersListPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    setErr("");
    try {
      const list = await api<UserRow[]>(apiPaths.adminUsers);
      setUsers(list);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.id.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="data-board">
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, role, ID…"
            aria-label="Search users"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <Link to="/admin/users/new" className="btn btn--primary btn--sm">
            Add user
          </Link>
          <Link to="/admin/users/status" className="btn btn--secondary btn--sm">
            Access
          </Link>
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadUsers}>
            Refresh
          </button>
        </div>
      </div>
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="td-mono td-muted-id">{u.id}</td>
                <td className="td-strong">{u.username}</td>
                <td><span className="pill pill--neutral">{u.role}</span></td>
                <td>
                  <span className={u.isActive ? "pill" : "pill pill--neutral"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>
                  {users.length === 0 ? "No users loaded." : "No rows match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> user{filtered.length === 1 ? "" : "s"}
            {search.trim() ? ` (of ${users.length})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
