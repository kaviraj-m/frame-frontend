import { Navigate, Route } from "react-router-dom";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminPricingPage } from "../pages/admin/pricing/AdminPricingPage";
import { AdminWhatsAppDraftPage } from "../pages/admin/AdminWhatsAppDraftPage";
import { AdminExecutiveFeaturesPage } from "../pages/admin/AdminExecutiveFeaturesPage";
import { AdminOrdersAllPage } from "../pages/admin/AdminOrdersAllPage";
import { AdminOrdersProductionPage } from "../pages/admin/AdminOrdersProductionPage";
import { AdminOrderPatchPage } from "../pages/admin/AdminOrderPatchPage";
import { AdminOrderFulfillmentPage } from "../pages/admin/AdminOrderFulfillmentPage";
import { AdminAttendanceReportPage } from "../pages/admin/AdminAttendanceReportPage";
import { AdminAuditLogPage } from "../pages/admin/AdminAuditLogPage";

export const adminNestedRoutes = [
  <Route key="adm-index" index element={<Navigate to="users" replace />} />,
  <Route key="adm-users-new" path="users/new" element={<Navigate to="/admin/users" replace />} />,
  <Route key="adm-users-status" path="users/status" element={<Navigate to="/admin/users" replace />} />,
  <Route key="adm-users" path="users" element={<AdminUsersPage />} />,
  <Route key="adm-pricing" path="pricing" element={<AdminPricingPage />} />,
  <Route key="adm-exec-features" path="settings/executive-features" element={<AdminExecutiveFeaturesPage />} />,
  <Route key="adm-whatsapp-draft" path="whatsapp-draft" element={<AdminWhatsAppDraftPage />} />,
  <Route key="adm-orders-production" path="orders/production" element={<AdminOrdersProductionPage />} />,
  <Route key="adm-orders-patch" path="orders/patch" element={<AdminOrderPatchPage />} />,
  <Route key="adm-orders-fulfill" path="orders/:orderId" element={<AdminOrderFulfillmentPage />} />,
  <Route key="adm-orders" path="orders" element={<AdminOrdersAllPage />} />,
  <Route key="adm-attendance-report" path="reports/attendance" element={<AdminAttendanceReportPage />} />,
  <Route key="adm-audit-log" path="audit-log" element={<AdminAuditLogPage />} />,
];
