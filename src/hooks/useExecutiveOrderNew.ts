import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiUpload } from "../lib/api";
import { apiPaths } from "../lib/apiPaths";
import { cataloguePrice } from "../lib/framePricing";
import {
  firstError,
  validatePositiveNumber,
  validateRequired,
} from "../lib/fieldValidation";
import type { ExecutiveOrderQuerySummary } from "../pages/executive/executiveOrderTypes";
import type { ExecutivePricingRow } from "../pages/executive/executivePricingTypes";

type ConfirmOrderResponse = { orderId: string };

export function useExecutiveOrderNew(queryId: string) {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ExecutiveOrderQuerySummary | null>(null);
  const [pricingOptions, setPricingOptions] = useState<ExecutivePricingRow[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [advancePayment, setAdvancePayment] = useState("100");
  const [paymentMode, setPaymentMode] = useState("");
  const [framingImages, setFramingImages] = useState<File[]>([]);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  function selectPaymentMode(mode: string) {
    setPaymentMode(mode);
    setPaymentProofFile(null);
    setFrameSize((prev) => {
      if (prev && pricingOptions.some((p) => p.frameSize === prev)) return prev;
      return pricingOptions[0]?.frameSize ?? "";
    });
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const paymentErr =
      paymentMode === "CASH" || paymentMode === "ONLINE"
        ? null
        : "Select payment mode (cash or online)";
    const addressErr = validateRequired(addressDetails, "Delivery address");
    const advanceErr = validatePositiveNumber(advancePayment, "Advance payment");
    const errors: Record<string, string> = {};
    if (paymentErr) errors.paymentMode = paymentErr;
    if (addressErr) errors.address = addressErr;
    if (advanceErr) errors.advance = advanceErr;
    setFieldErrors(errors);
    const validationError = firstError(paymentErr, addressErr, advanceErr);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      if (pricingOptions.length === 0 || !frameSize.trim()) {
        setError(
          catalogError ||
            "Select a frame size from the catalogue. If the list is empty, ask an admin to configure pricing.",
        );
        return;
      }
      const row = pricingOptions.find((p) => p.frameSize === frameSize);
      if (!row) {
        setError("Selected frame size is not in the catalogue.");
        return;
      }
      const fullPrice = cataloguePrice(row, paymentMode);
      if (Number(advancePayment) > fullPrice) {
        setError("Advance payment cannot exceed the full price for this frame size and payment mode.");
        setFieldErrors((prev) => ({
          ...prev,
          advance: "Advance cannot exceed full price",
        }));
        return;
      }
      if (framingImages.length === 0) {
        setError("Add at least one image for framing before confirming.");
        return;
      }
      if (paymentMode === "ONLINE" && !paymentProofFile) {
        setError("Online payment requires a payment screenshot upload.");
        return;
      }

      setSubmitting(true);

      let proofKey = "";
      if (paymentMode === "ONLINE") {
        setStatus("Uploading payment screenshot…");
        const fd = new FormData();
        fd.append("file", paymentProofFile);
        const up = await apiUpload<{ r2Key: string }>(apiPaths.executiveUploads, fd);
        proofKey = up.r2Key;
      }

      setStatus("Confirming order…");
      const order = await api<ConfirmOrderResponse>(apiPaths.executiveOrders, {
        method: "POST",
        body: JSON.stringify({
          queryId,
          frameSize,
          addressDetails: addressDetails.trim(),
          photos: [],
          advancePayment: Number(advancePayment),
          paymentMode,
          advancePaymentScreenshot: paymentMode === "ONLINE" ? proofKey : "",
        }),
      });

      for (let i = 0; i < framingImages.length; i++) {
        setStatus(`Uploading framing image ${i + 1} of ${framingImages.length}…`);
        const custFd = new FormData();
        custFd.append("file", framingImages[i]);
        await apiUpload(apiPaths.executiveOrderAsset(order.orderId, "customer"), custFd);
      }

      setStatus("Order confirmed.");
      navigate("/executive/orders");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
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
    setPaymentMode: selectPaymentMode,
    framingImages,
    setFramingImages,
    paymentProofFile,
    setPaymentProofFile,
    status,
    error,
    fieldErrors,
    clearFieldError: (key: string) =>
      setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev)),
    submitting,
    createOrder,
  };
}
