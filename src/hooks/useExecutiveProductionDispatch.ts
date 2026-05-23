import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";

type ExecutiveFeatures = { productionDispatchEnabled: boolean };

export function useExecutiveProductionDispatch() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api<ExecutiveFeatures>(apiPaths.executiveFeatures);
        if (!cancelled) {
          setEnabled(cfg.productionDispatchEnabled);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEnabled(false);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, loaded };
}
