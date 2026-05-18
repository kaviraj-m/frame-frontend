import { Navigate, Route } from "react-router-dom";
import { AdminUsersListPage } from "../pages/admin/AdminUsersListPage";
import { AdminUserNewPage } from "../pages/admin/AdminUserNewPage";
import { AdminUserStatusPage } from "../pages/admin/AdminUserStatusPage";
import { AdminPricingPage } from "../pages/admin/pricing/AdminPricingPage";
import { AdminTemplatesPage } from "../pages/admin/AdminTemplatesPage";
import { AdminNotifyPage } from "../pages/admin/AdminNotifyPage";
import { AdminOrdersAllPage } from "../pages/admin/AdminOrdersAllPage";
import { AdminOrdersProductionPage } from "../pages/admin/AdminOrdersProductionPage";
import { AdminOrderPatchPage } from "../pages/admin/AdminOrderPatchPage";
import { AdminOrderFulfillmentPage } from "../pages/admin/AdminOrderFulfillmentPage";
import { AdminAttendanceReportPage } from "../pages/admin/AdminAttendanceReportPage";

export const adminNestedRoutes = [
  <Route key="adm-index" index element={<Navigate to="users" replace />} />,
  <Route key="adm-users-new" path="users/new" element={<AdminUserNewPage />} />,
  <Route key="adm-users-status" path="users/status" element={<AdminUserStatusPage />} />,
  <Route key="adm-users" path="users" element={<AdminUsersListPage />} />,
  <Route key="adm-pricing" path="pricing" element={<AdminPricingPage />} />,
  <Route key="adm-templates" path="templates" element={<AdminTemplatesPage />} />,
  <Route key="adm-notify" path="notify" element={<AdminNotifyPage />} />,
  <Route key="adm-orders-production" path="orders/production" element={<AdminOrdersProductionPage />} />,
  <Route key="adm-orders-patch" path="orders/patch" element={<AdminOrderPatchPage />} />,
  <Route key="adm-orders-fulfill" path="orders/:orderId" element={<AdminOrderFulfillmentPage />} />,
  <Route key="adm-orders" path="orders" element={<AdminOrdersAllPage />} />,
  <Route key="adm-attendance-report" path="reports/attendance" element={<AdminAttendanceReportPage />} />,
];
