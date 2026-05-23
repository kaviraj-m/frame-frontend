import { PageHeader } from "@/components/ui/PageHeader";
import { MyAttendanceDay } from "@/components/attendance/MyAttendanceDay";

export function DesignerAttendancePage() {
  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker="Time"
        title="My attendance"
        description="Present and break times are tracked automatically while you work on Memorix. All times are in IST (India)."
      />
      <MyAttendanceDay apiPrefix="/api/designer" />
    </div>
  );
}
