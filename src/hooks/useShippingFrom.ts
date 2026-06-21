import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ShippingFromAddress } from "@/lib/shippingFromTypes";

export function useShippingFrom(apiPath: string) {
  const [shippingFrom, setShippingFrom] = useState<ShippingFromAddress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api<ShippingFromAddress>(apiPath);
        if (!cancelled) setShippingFrom(cfg);
      } catch {
        if (!cancelled) setShippingFrom(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiPath]);

  return { shippingFrom, loaded };
}
