import { Navigate, Route } from "react-router-dom";
import { DesignerQueuePage } from "../pages/designer/DesignerQueuePage";
import { DesignerOrderWorkPage } from "../pages/designer/DesignerOrderWorkPage";
import { DesignerAttendancePage } from "../pages/designer/DesignerAttendancePage";

export const designerNestedRoutes = [
  <Route key="des-index" index element={<Navigate to="queue" replace />} />,
  <Route key="des-queue" path="queue" element={<DesignerQueuePage />} />,
  <Route key="des-order" path="orders/:orderId" element={<DesignerOrderWorkPage />} />,
  <Route key="des-attendance" path="attendance" element={<DesignerAttendancePage />} />,
];
