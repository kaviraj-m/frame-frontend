import { PageHeader } from "../../components/ui/PageHeader";
import { AttendancePanel } from "../../components/AttendancePanel";

export function ExecutiveAttendancePage() {
  return (
    <div className="page-stack">
      <PageHeader
        kicker="Time"
        title="Attendance"
        description="Clock in, break, clock out. Same panel for every executive on this device."
      />
      <AttendancePanel apiPrefix="/api/executive" />
    </div>
  );
}
