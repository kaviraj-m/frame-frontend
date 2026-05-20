import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { PageHeader } from "../../components/ui/PageHeader";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { AdminUserEditorModal } from "./users/AdminUserEditorModal";
import { AdminUserPasswordModal } from "./users/AdminUserPasswordModal";
import type { AdminUserRow } from "./users/adminUserTypes";
import { useAdminUsersList } from "./users/useAdminUsersList";

export function AdminUsersPage() {
  const {
    filtered,
    users,
    search,
    setSearch,
    loadUsers,
    msg,
    err,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
  } = useAdminUsersList();

  const currentUserId = localStorage.getItem("userId") ?? "";

  function canDeleteUser(user: AdminUserRow) {
    return user.role !== "ADMIN" && user.id !== currentUserId;
  }

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminUserRow | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

  function requestDelete(user: AdminUserRow, closeEditorAfter = false) {
    confirmAction(
      {
        title: "Delete user",
        message: `Delete user "${user.username}"? This cannot be undone.`,
        confirmLabel: "Delete user",
        variant: "danger",
      },
      async () => {
        const ok = await deleteUser(user.id);
        if (ok && closeEditorAfter) closeEditor();
      },
    );
  }

  function openCreate() {
    setEditingUser(null);
    setEditorOpen(true);
  }

  function openEdit(user: AdminUserRow) {
    setEditingUser(user);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingUser(null);
  }

  function openChangePassword(user: AdminUserRow) {
    setPasswordUser(user);
    setPasswordOpen(true);
  }

  function closePassword() {
    setPasswordOpen(false);
    setPasswordUser(null);
  }

  return (
    <div className="data-board">
      <PageHeader
        kicker="Team"
        title="User management"
        description="Create accounts, manage access, reset passwords, and remove users. Sign-in accepts email or username."
      />
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, role, ID…"
            aria-label="Search users"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            Add user
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadUsers}>
            Refresh
          </button>
        </div>
      </div>
      {msg && (
        <div className="flash flash--success" role="status">
          {msg}
        </div>
      )}
      {err && (
        <div className="flash flash--error" role="alert">
          {err}
        </div>
      )}
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="is-clickable-row"
                onClick={() => openEdit(u)}
              >
                <td className="td-strong">{u.username}</td>
                <td className="td-muted">{u.email?.trim() ? u.email : "—"}</td>
                <td>
                  <span className="pill pill--neutral">{u.role}</span>
                </td>
                <td>
                  <span className={u.isActive ? "pill" : "pill pill--neutral"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(u);
                      }}
                    >
                      Edit
                    </button>
                    {canDeleteUser(u) ? (
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(u);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={5}>
                  {users.length === 0
                    ? "No users yet. Use “Add user” to create one."
                    : "No rows match your search."}
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

      <AdminUserEditorModal
        open={editorOpen}
        editingUser={editingUser}
        onClose={closeEditor}
        onCreate={createUser}
        onUpdate={updateUser}
        onOpenChangePassword={(user) => {
          closeEditor();
          openChangePassword(user);
        }}
        onRequestDelete={(user) => requestDelete(user, true)}
        canDelete={editingUser != null && canDeleteUser(editingUser)}
      />
      <ConfirmDialog {...dialogProps} />
      <AdminUserPasswordModal
        open={passwordOpen}
        user={passwordUser}
        onClose={closePassword}
        onSave={changePassword}
      />
    </div>
  );
}
