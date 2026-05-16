import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { apiPaths } from "../../../lib/apiPaths";
import type { AdminPricingRow } from "../adminPricingTypes";

export type AdminPricingUpsertBody = {
  frameSize: string;
  price: number;
  isActive: boolean;
};

export function useAdminPricingList() {
  const [rows, setRows] = useState<AdminPricingRow[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadRows = useCallback(async () => {
    setErr("");
    try {
      const list = await api<AdminPricingRow[]>(apiPaths.adminPricing);
      setRows(list);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.frameSize.toLowerCase().includes(q));
  }, [rows, search]);

  const savePricing = useCallback(
    async (body: AdminPricingUpsertBody): Promise<boolean> => {
      setErr("");
      setMsg("");
      try {
        await api(apiPaths.adminPricing, {
          method: "POST",
          body: JSON.stringify(body),
        });
        setMsg("Pricing saved.");
        await loadRows();
        return true;
      } catch (e) {
        setErr((e as Error).message);
        return false;
      }
    },
    [loadRows],
  );

  return {
    rows,
    filtered,
    search,
    setSearch,
    loadRows,
    msg,
    err,
    savePricing,
  };
}
