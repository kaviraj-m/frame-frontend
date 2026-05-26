import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { AdminUserEditorModal } from "./users/AdminUserEditorModal";
import { AdminUserPasswordModal } from "./users/AdminUserPasswordModal";
import type { AdminUserRow } from "./users/adminUserTypes";
import { useAdminUsersList } from "./users/useAdminUsersList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";

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
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <PageHeader
        kicker="Team"
        title="User management"
        description="Create accounts, manage access, reset passwords, and remove users. Sign-in accepts email or username."
      />
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, role, ID…"
            aria-label="Search users"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-2 items-center">
          <Button type="button" size="sm" onClick={openCreate}>
            Add user
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={loadUsers}>
            Refresh
          </Button>
        </div>
      </div>
      {msg && (
        <Alert variant="success" role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                className="cursor-pointer"
                onClick={() => openEdit(u)}
              >
                <TableCell className="font-semibold">{u.username}</TableCell>
                <TableCell className="text-muted-foreground">{u.email?.trim() ? u.email : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "success" : "secondary"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/admin/users/${encodeURIComponent(u.id)}`}>Details</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(u);
                      }}
                    >
                      Edit
                    </Button>
                    {canDeleteUser(u) ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(u);
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {users.length === 0
                    ? "No users yet. Use “Add user” to create one."
                    : "No rows match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          Showing <strong>{filtered.length}</strong> user{filtered.length === 1 ? "" : "s"}
          {search.trim() ? ` (of ${users.length})` : ""}
        </p>
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
