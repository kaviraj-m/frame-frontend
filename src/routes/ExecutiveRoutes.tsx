import { Navigate, Route } from "react-router-dom";
import { ExecutiveQueriesPage } from "../pages/executive/ExecutiveQueriesPage";
import { ExecutiveQueryNewPage } from "../pages/executive/ExecutiveQueryNewPage";
import { ExecutiveQueryRemarksPage } from "../pages/executive/ExecutiveQueryRemarksPage";
import { ExecutiveOrdersListPage } from "../pages/executive/ExecutiveOrdersListPage";
import { ExecutiveOrderNewPage } from "../pages/executive/ExecutiveOrderNewPage";
import { ExecutiveOrderAssetsPage } from "../pages/executive/ExecutiveOrderAssetsPage";
import { ExecutiveAttendancePage } from "../pages/executive/ExecutiveAttendancePage";
import { ExecutiveOrdersProductionPage } from "../pages/executive/ExecutiveOrdersProductionPage";
import { ExecutiveOrderFulfillmentPage } from "../pages/executive/ExecutiveOrderFulfillmentPage";

/** Route nodes for use under `<Route path="/executive">` — must be `<Route>` elements, not a wrapper component (React Router v6). */
export const executiveNestedRoutes = [
  <Route key="exec-index" index element={<Navigate to="queries" replace />} />,
  <Route key="exec-queries-new" path="queries/new" element={<ExecutiveQueryNewPage />} />,
  <Route key="exec-queries-remarks" path="queries/:queryId/remarks" element={<ExecutiveQueryRemarksPage />} />,
  <Route key="exec-queries" path="queries" element={<ExecutiveQueriesPage />} />,
  <Route key="exec-orders-new" path="orders/new/:queryId" element={<ExecutiveOrderNewPage />} />,
  <Route key="exec-orders-production" path="orders/production" element={<ExecutiveOrdersProductionPage />} />,
  <Route key="exec-orders-fulfill" path="orders/:orderId/fulfill" element={<ExecutiveOrderFulfillmentPage />} />,
  <Route key="exec-orders-assets" path="orders/:orderId/assets" element={<ExecutiveOrderAssetsPage />} />,
  <Route key="exec-orders" path="orders" element={<ExecutiveOrdersListPage />} />,
  <Route key="exec-attendance" path="attendance" element={<ExecutiveAttendancePage />} />,
];
