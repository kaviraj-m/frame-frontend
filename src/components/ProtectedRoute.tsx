import { Navigate } from "react-router-dom";

function getRole(): string | null {
  return localStorage.getItem("role");
}

export function ProtectedRoute({ role, children }: { role: string; children: JSX.Element }) {
  const current = getRole();
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (current !== role) return <Navigate to={`/${(current || "").toLowerCase()}`} replace />;
  return children;
}
