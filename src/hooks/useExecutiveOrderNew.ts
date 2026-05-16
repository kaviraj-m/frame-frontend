import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiUpload } from "../lib/api";
import { apiPaths } from "../lib/apiPaths";
import type { ExecutiveOrderQuerySummary } from "../pages/executive/executiveOrderTypes";
import type { ExecutivePricingRow } from "../pages/executive/executivePricingTypes";

type ConfirmOrderResponse = { orderId: string };

function fileKey(f: File): string {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

export function useExecutiveOrderNew(queryId: string) {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ExecutiveOrderQuerySummary | null>(null);
  const [pricingOptions, setPricingOptions] = useState<ExecutivePricingRow[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [advancePayment, setAdvancePayment] = useState("100");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [framingImages, setFramingImages] = useState<File[]>([]);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!queryId) return;
      setError("");
      setCatalogError("");
      setPricingLoaded(false);
      try {
        const [list, pricing] = await Promise.all([
          api<ExecutiveOrderQuerySummary[]>(apiPaths.executiveQueries),
          api<ExecutivePricingRow[]>(apiPaths.executivePricing),
        ]);
        if (cancelled) return;
        const found = list.find((q) => q.queryId === queryId) ?? null;
        setQuery(found);
        if (!found) {
          setError("This query was not found. Create the customer query first.");
        }
        setPricingOptions(pricing);
        if (pricing.length === 0) {
          setCatalogError(
            "No active frame sizes in the catalogue. An admin must add pricing under Admin → Frame prices.",
          );
          setFrameSize("");
        } else {
          setFrameSize((prev) => {
            if (prev && pricing.some((p) => p.frameSize === prev)) return prev;
            return pricing[0].frameSize;
          });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setPricingLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryId]);

  function addFramingImages(files: FileList | null) {
    if (!files?.length) return;
    setFramingImages((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of Array.from(files)) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      return next;
    });
  }

  function removeFramingImage(index: number) {
    setFramingImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      if (pricingOptions.length === 0 || !frameSize.trim()) {
        setError(
          catalogError ||
            "Select a frame size from the catalogue. If the list is empty, ask an admin to configure pricing.",
        );
        return;
      }
      if (framingImages.length === 0) {
        setError("Add at least one image for framing before confirming.");
        return;
      }

      let proofKey = "";
      if (paymentMode === "ONLINE") {
        if (!paymentProofFile) {
          setError("Online payment requires a payment screenshot upload.");
          return;
        }
        const fd = new FormData();
        fd.append("file", paymentProofFile);
        const up = await apiUpload<{ r2Key: string }>(apiPaths.executiveUploads, fd);
        proofKey = up.r2Key;
      }

      const order = await api<ConfirmOrderResponse>(apiPaths.executiveOrders, {
        method: "POST",
        body: JSON.stringify({
          queryId,
          frameSize,
          addressDetails: addressDetails || "—",
          photos: [],
          advancePayment: Number(advancePayment),
          paymentMode,
          advancePaymentScreenshot: paymentMode === "ONLINE" ? proofKey : "",
        }),
      });

      for (const file of framingImages) {
        const custFd = new FormData();
        custFd.append("file", file);
        await apiUpload(apiPaths.executiveOrderAsset(order.orderId, "customer"), custFd);
      }

      setStatus("Order confirmed.");
      navigate("/executive/orders");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return {
    query,
    pricingOptions,
    pricingLoaded,
    catalogError,
    frameSize,
    setFrameSize,
    addressDetails,
    setAddressDetails,
    advancePayment,
    setAdvancePayment,
    paymentMode,
    setPaymentMode,
    framingImages,
    addFramingImages,
    removeFramingImage,
    paymentProofFile,
    setPaymentProofFile,
    status,
    error,
    createOrder,
  };
}
