import { PageHeader } from "../../components/ui/PageHeader";
import { AttendancePanel } from "../../components/AttendancePanel";

export function ExecutiveAttendancePage() {
  return (
    <div className="page-stack">
      <PageHeader
        kicker="Time"
        title="Attendance"
        description="Clock in, take breaks, and clock out. Leaving this tab for more than 30 seconds ends your session automatically."
      />
      <AttendancePanel />
    </div>
  );
}
