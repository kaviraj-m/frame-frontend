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

export type DraftLine = {
  id: string;
  frameSize: string;
  quantity: number;
  images: File[];
};

type ConfirmLineItem = {
  lineItemId: string;
  frameSize: string;
  quantity: number;
  sortOrder: number;
};

type ConfirmOrderResponse = {
  orderId: string;
  lineItems: ConfirmLineItem[];
};

function draftLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function newDraftLine(frameSize = ""): DraftLine {
  return {
    id: draftLineId(),
    frameSize,
    quantity: 1,
    images: [],
  };
}

function orderTotal(lines: DraftLine[], pricing: ExecutivePricingRow[], paymentMode: string): number {
  let total = 0;
  for (const line of lines) {
    const row = pricing.find((p) => p.frameSize === line.frameSize);
    if (!row) continue;
    total += cataloguePrice(row, paymentMode) * Math.max(1, line.quantity);
  }
  return total;
}

export function useExecutiveOrderNew(queryId: string) {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ExecutiveOrderQuerySummary | null>(null);
  const [pricingOptions, setPricingOptions] = useState<ExecutivePricingRow[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()]);
  const [addressDetails, setAddressDetails] = useState("");
  const [pincode, setPincode] = useState("");
  const [advancePayment, setAdvancePayment] = useState("100");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentProofFiles, setPaymentProofFiles] = useState<File[]>([]);
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
    setPaymentProofFiles([]);
    setLines((prev) => {
      if (prev.length === 0) {
        return [newDraftLine(pricingOptions[0]?.frameSize ?? "")];
      }
      return prev.map((line, i) =>
        i === 0 && !line.frameSize
          ? { ...line, frameSize: pricingOptions[0]?.frameSize ?? "" }
          : line,
      );
    });
  }

  function addLine() {
    setLines((prev) => [...prev, newDraftLine(pricingOptions[0]?.frameSize ?? "")]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function setLineImages(id: string, images: File[]) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, images } : l)),
    );
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
    const pincodeErr = validateRequired(pincode, "Pincode");
    const advanceErr = validatePositiveNumber(advancePayment, "Advance payment");
    const errors: Record<string, string> = {};
    if (paymentErr) errors.paymentMode = paymentErr;
    if (addressErr) errors.address = addressErr;
    if (pincodeErr) errors.pincode = pincodeErr;
    if (advanceErr) errors.advance = advanceErr;
    setFieldErrors(errors);
    const validationError = firstError(paymentErr, addressErr, pincodeErr, advanceErr);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      if (pricingOptions.length === 0) {
        setError(
          catalogError ||
            "No active frame sizes in the catalogue. Ask an admin to configure pricing.",
        );
        return;
      }
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.frameSize.trim()) {
          setError(`Select a frame size for frame ${i + 1}.`);
          return;
        }
        if (!pricingOptions.some((p) => p.frameSize === line.frameSize)) {
          setError(`Frame ${i + 1}: size is not in the catalogue.`);
          return;
        }
        if (line.quantity < 1) {
          setError(`Frame ${i + 1}: quantity must be at least 1.`);
          return;
        }
        if (line.images.length === 0) {
          setError(`Add at least one framing image for ${line.frameSize}.`);
          return;
        }
      }
      const fullPrice = orderTotal(lines, pricingOptions, paymentMode);
      if (fullPrice <= 0) {
        setError("Could not calculate order total. Check frame sizes and payment mode.");
        return;
      }
      if (Number(advancePayment) > fullPrice) {
        setError("Advance payment cannot exceed the full order price.");
        setFieldErrors((prev) => ({
          ...prev,
          advance: "Advance cannot exceed full price",
        }));
        return;
      }
      if (paymentMode === "ONLINE" && paymentProofFiles.length === 0) {
        setError("Online payment requires at least one payment screenshot.");
        return;
      }

      setSubmitting(true);

      const proofKeys: string[] = [];
      if (paymentMode === "ONLINE") {
        for (let i = 0; i < paymentProofFiles.length; i++) {
          setStatus(`Uploading payment proof ${i + 1} of ${paymentProofFiles.length}…`);
          const fd = new FormData();
          fd.append("file", paymentProofFiles[i]);
          const up = await apiUpload<{ r2Key: string }>(apiPaths.executiveUploads, fd);
          proofKeys.push(up.r2Key);
        }
      }

      setStatus("Confirming order…");
      const confirmLines = lines.map((line, i) => ({
        frameSize: line.frameSize,
        quantity: Math.max(1, line.quantity),
        sortOrder: i + 1,
      }));
      const res = await api<ConfirmOrderResponse>(apiPaths.executiveOrders, {
        method: "POST",
        body: JSON.stringify({
          queryId,
          addressDetails: addressDetails.trim(),
          pincode: pincode.trim(),
          advancePayment: Number(advancePayment),
          paymentMode,
          advancePaymentScreenshots: proofKeys,
          lines: confirmLines,
        }),
      });

      const itemsBySort = [...res.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);

      for (let i = 0; i < lines.length; i++) {
        const draft = lines[i];
        const item = itemsBySort[i];
        if (!item) {
          throw new Error(`Missing line item for frame ${i + 1} after confirm.`);
        }
        for (let i = 0; i < draft.images.length; i++) {
          setStatus(
            `Uploading ${draft.frameSize} image ${i + 1} of ${draft.images.length}…`,
          );
          const custFd = new FormData();
          custFd.append("file", draft.images[i]);
          await apiUpload(
            apiPaths.executiveOrderLineAsset(res.orderId, item.lineItemId, "customer"),
            custFd,
          );
        }
      }

      setStatus("Order confirmed.");
      navigate("/executive/orders");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const orderTotalPrice =
    paymentMode === "CASH" || paymentMode === "ONLINE"
      ? orderTotal(lines, pricingOptions, paymentMode)
      : null;

  return {
    query,
    pricingOptions,
    pricingLoaded,
    catalogError,
    lines,
    addLine,
    removeLine,
    updateLine,
    setLineImages,
    orderTotalPrice,
    addressDetails,
    setAddressDetails,
    pincode,
    setPincode,
    advancePayment,
    setAdvancePayment,
    paymentMode,
    setPaymentMode: selectPaymentMode,
    paymentProofFiles,
    setPaymentProofFiles,
    status,
    error,
    fieldErrors,
    clearFieldError: (key: string) =>
      setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev)),
    submitting,
    createOrder,
  };
}
