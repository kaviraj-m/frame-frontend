import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AttendanceControls() {
  const { status, error, hydrated, startBreak, endBreak, endDay } = useSmartAttendanceContext();

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading attendance…</p>;
  }

  if (status === "offline") {
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
          Present time is tracked while you stay on this site. Leaving the tab or another app for 10
          seconds starts an automatic break. Return to resume present time.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status === "break" || status === "away_pending" ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => void endBreak()}>
            End break
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={() => void startBreak()}>
            Start manual break
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => void endDay()}>
          End work day
        </Button>
      </CardContent>
      {error ? (
        <Alert variant="destructive" className="mx-6 mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
