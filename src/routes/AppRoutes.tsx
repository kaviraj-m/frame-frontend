import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { ExecutiveLayout } from "../pages/executive/ExecutiveLayout";
import { DesignerLayout } from "../pages/designer/DesignerLayout";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { adminNestedRoutes } from "./AdminRoutes";
import { designerNestedRoutes } from "./DesignerRoutes";
import { executiveNestedRoutes } from "./ExecutiveRoutes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/executive"
        element={
          <ProtectedRoute role="EXECUTIVE">
            <ExecutiveLayout />
          </ProtectedRoute>
        }
      >
        {executiveNestedRoutes}
      </Route>
      <Route
        path="/designer"
        element={
          <ProtectedRoute role="DESIGNER">
            <DesignerLayout />
          </ProtectedRoute>
        }
      >
        {designerNestedRoutes}
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {adminNestedRoutes}
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
