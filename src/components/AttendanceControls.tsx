import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AttendanceControls() {
  const { status, error, hydrated, attendanceId, startBreak, endBreak } = useSmartAttendanceContext();

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading attendance…</p>;
  }

  if (!attendanceId) {
    return (
      <p className="text-sm text-muted-foreground">
        No active work session. Sign in again to start tracking automatically.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold">Break controls</h3>
        <p className="text-sm text-muted-foreground">
          <strong>Present</strong> — working on this site; the app pings every 3 minutes. If pings stop
          for 3+ minutes, that time counts as <strong>offline</strong> (not break).{" "}
          <strong>Break</strong> — only when you press Break; use Break done when you return.{" "}
          <strong>Logout</strong> ends your session; signing in again starts a new present session.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status === "break" ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => void endBreak()}>
            Break done
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={() => void startBreak()}>
            Break
          </Button>
        )}
      </CardContent>
      {error ? (
        <Alert variant="destructive" className="mx-6 mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
