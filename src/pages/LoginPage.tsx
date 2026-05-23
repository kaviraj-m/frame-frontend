import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { firstError, validateRequired } from "@/lib/fieldValidation";

export function LoginPage() {
  const nav = useNavigate();
  const { setUserId } = useTheme();
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
      setUserId(out.user.id);
      nav(`/${out.user.role.toLowerCase()}`);
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-7">
      <div className="fixed top-4 right-4 z-50">
        <ThemePicker />
      </div>
      <div className="grid w-full max-w-md gap-6">
        <div className="flex w-full justify-center">
          <BrandMark variant="login" />
        </div>
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <p className="text-sm text-muted-foreground">
              Orders, queries, and production — one place.
            </p>
          </CardHeader>
          <form onSubmit={onSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Email or username</Label>
                <Input
                  id="login-username"
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
                {fieldErrors.username ? (
                  <p className="text-xs text-destructive">{fieldErrors.username}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                ) : null}
              </div>
              {err ? (
                <Alert variant="destructive">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
