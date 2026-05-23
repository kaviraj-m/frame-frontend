import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ExecutiveFeaturesConfig = { productionDispatchEnabled: boolean };

export function AdminExecutiveFeaturesPage() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const cfg = await api<ExecutiveFeaturesConfig>(apiPaths.adminExecutiveFeatures);
        if (!cancelled) {
          setEnabled(cfg.productionDispatchEnabled);
          setLoaded(true);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);
    try {
      const cfg = await api<ExecutiveFeaturesConfig>(apiPaths.adminExecutiveFeatures, {
        method: "PUT",
        body: JSON.stringify({ productionDispatchEnabled: enabled }),
      });
      setEnabled(cfg.productionDispatchEnabled);
      setMsg(
        cfg.productionDispatchEnabled
          ? "Production & dispatch is now enabled for executives."
          : "Production & dispatch is now hidden from executives.",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker="Admin"
        title="Executive features"
        description="Control which operational tools executives can access."
      />

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {msg ? (
        <Alert role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-xl">
        <form onSubmit={save} className="flex flex-col gap-4">
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!loaded || saving}
            />
            <span>
              <span className="font-semibold block">Allow executives to use Production &amp; dispatch</span>
              <span className="text-muted-foreground">
                When on, executives see the production queue and can run print, balance, tracking, and dispatch on
                their own orders. When off, the menu and APIs are hidden.
              </span>
            </span>
          </label>
          <div>
            <Button type="submit" disabled={!loaded || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
