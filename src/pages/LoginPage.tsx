import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../components/ui/FormField";
import { api } from "../lib/api";
import { apiPaths } from "../lib/apiPaths";
import { firstError, validateRequired } from "../lib/fieldValidation";

export function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const usernameErr = validateRequired(username, "Email or username");
    const passwordErr = validateRequired(password, "Password");
    const errors: Record<string, string> = {};
    if (usernameErr) errors.username = usernameErr;
    if (passwordErr) errors.password = passwordErr;
    setFieldErrors(errors);
    const validationError = firstError(usernameErr, passwordErr);
    if (validationError) {
      setErr(validationError);
      return;
    }
    try {
      const out = await api<{
        token: string;
        refreshToken: string;
        user: { id: string; role: string };
      }>(apiPaths.authLogin, {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
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
      <form onSubmit={onSubmit} className="card login-card" noValidate>
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
          <FormField label="Email or username" required error={fieldErrors.username}>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" }));
              }}
              type="text"
              autoComplete="username"
              placeholder="you@company.com or username"
              aria-invalid={!!fieldErrors.username}
            />
          </FormField>
          <FormField label="Password" required error={fieldErrors.password}>
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              type="password"
              autoComplete="current-password"
              aria-invalid={!!fieldErrors.password}
            />
          </FormField>
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
