import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { apiPaths } from "../lib/apiPaths";

export function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const out = await api<{
        token: string;
        refreshToken: string;
        user: { id: string; role: string };
      }>(apiPaths.authLogin, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("token", out.token);
      localStorage.setItem("refreshToken", out.refreshToken);
      localStorage.setItem("role", out.user.role);
      localStorage.setItem("userId", out.user.id);
      localStorage.setItem("username", username.trim());
      nav(`/${out.user.role.toLowerCase()}`);
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  return (
    <div className="login-wrap">
      <form onSubmit={onSubmit} className="card login-card">
        <div className="login-brand">
          <div className="shell-brand__mark shell-brand__mark--lg" aria-hidden>
            K
          </div>
          <div>
            <h1 className="login-title">KaspX</h1>
            <p className="login-subtitle">Orders, queries, and production — one place.</p>
          </div>
        </div>
        <div className="field-grid login-fields">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
          </label>
        </div>
        <button type="submit" className="btn btn--primary login-submit">
          Sign in
        </button>
        {err ? (
          <div className="flash flash--error login-error" role="alert">
            {err}
          </div>
        ) : null}
      </form>
    </div>
  );
}
