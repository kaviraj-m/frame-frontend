import { PageHeader } from "../../components/ui/PageHeader";
import { AttendancePanel } from "../../components/AttendancePanel";

export function DesignerAttendancePage() {
  return (
    <div className="page-stack">
      <PageHeader
        kicker="Time"
        title="Attendance"
        description="Start shift, take breaks, and end the day. Leaving this tab for more than 30 seconds ends your session automatically."
      />
      <AttendancePanel />
    </div>
  );
}
