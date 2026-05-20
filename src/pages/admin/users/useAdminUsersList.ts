import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { apiPaths } from "../../../lib/apiPaths";
import type {
  AdminUserCreateBody,
  AdminUserRow,
  AdminUserUpdateBody,
} from "./adminUserTypes";

export function useAdminUsersList() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadUsers = useCallback(async () => {
    setErr("");
    try {
      const list = await api<AdminUserRow[]>(apiPaths.adminUsers);
      setUsers(list);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.id.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const createUser = useCallback(
    async (body: AdminUserCreateBody): Promise<boolean> => {
      setErr("");
      setMsg("");
      try {
        await api(apiPaths.adminUsers, {
          method: "POST",
          body: JSON.stringify({
            username: body.username.trim(),
            email: body.email.trim(),
            password: body.password,
            role: body.role,
          }),
        });
        setMsg("User created.");
        await loadUsers();
        return true;
      } catch (e) {
        setErr((e as Error).message);
        return false;
      }
    },
    [loadUsers],
  );

  const updateUser = useCallback(
    async (userId: string, body: AdminUserUpdateBody): Promise<boolean> => {
      setErr("");
      setMsg("");
      try {
        await api(apiPaths.adminUser(userId), {
          method: "PUT",
          body: JSON.stringify({
            username: body.username.trim(),
            email: body.email.trim(),
            role: body.role,
            isActive: body.isActive,
          }),
        });
        setMsg("User updated.");
        await loadUsers();
        return true;
      } catch (e) {
        setErr((e as Error).message);
        return false;
      }
    },
    [loadUsers],
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      setErr("");
      setMsg("");
      try {
        await api(apiPaths.adminUser(userId), { method: "DELETE" });
        setMsg("User deleted.");
        await loadUsers();
        return true;
      } catch (e) {
        setErr((e as Error).message);
        return false;
      }
    },
    [loadUsers],
  );

  const changePassword = useCallback(
    async (userId: string, password: string): Promise<boolean> => {
      setErr("");
      setMsg("");
      try {
        await api(apiPaths.adminUserPassword(userId), {
          method: "PUT",
          body: JSON.stringify({ password }),
        });
        setMsg("Password updated.");
        return true;
      } catch (e) {
        setErr((e as Error).message);
        return false;
      }
    },
    [],
  );

  return {
    users,
    filtered,
    search,
    setSearch,
    loadUsers,
    msg,
    err,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
  };
}
