import { PageHeader } from "../../components/ui/PageHeader";
import { AttendancePanel } from "../../components/AttendancePanel";

export function DesignerAttendancePage() {
  return (
    <div className="page-stack">
      <PageHeader
        kicker="Time"
        title="Attendance"
        description="Same clock as production: start shift, pause for tea, finish the day."
      />
      <AttendancePanel apiPrefix="/api/designer" />
    </div>
  );
}
