import { Navigate, Route } from "react-router-dom";
import { DesignerQueuePage } from "../pages/designer/DesignerQueuePage";
import { DesignerPreviewPage } from "../pages/designer/DesignerPreviewPage";
import { DesignerAttendancePage } from "../pages/designer/DesignerAttendancePage";

export const designerNestedRoutes = [
  <Route key="des-index" index element={<Navigate to="queue" replace />} />,
  <Route key="des-queue" path="queue" element={<DesignerQueuePage />} />,
  <Route key="des-preview" path="orders/:orderId/preview" element={<DesignerPreviewPage />} />,
  <Route key="des-attendance" path="attendance" element={<DesignerAttendancePage />} />,
];
