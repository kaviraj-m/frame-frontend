import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { executiveFulfillmentPortal } from "@/lib/fulfillmentPortal";
import { OrderFulfillmentPage } from "../admin/AdminOrderFulfillmentPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ExecutiveFeatures = { productionDispatchEnabled: boolean };

export function ExecutiveOrderFulfillmentPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api<ExecutiveFeatures>(apiPaths.executiveFeatures);
        if (!cancelled) setEnabled(cfg.productionDispatchEnabled);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (enabled === null && !error) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!enabled) {
    return (
      <div className="flex flex-col gap-6 min-w-0 w-full">
        <PageHeader
          kicker="Executive"
          title="Fulfillment"
          description="Production & dispatch is not enabled for executives."
        />
        <p className="text-sm">
          <Link to="/executive/orders" className="text-primary font-semibold hover:underline">
            ← Back to orders
          </Link>
        </p>
      </div>
    );
  }

  return <OrderFulfillmentPage portal={executiveFulfillmentPortal} />;
}
