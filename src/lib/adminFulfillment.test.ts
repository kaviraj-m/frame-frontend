import { describe, expect, it } from "vitest";
import {
  canCollectBalance,
  canDispatch,
  canMarkFrameReady,
  canMarkPrintDone,
  canUploadPrintImage,
  canWhatsAppDispatch,
  canWhatsAppPrint,
  fulfillmentQueueAction,
  fulfillmentStepStates,
  hasPrintImage,
  hasSavedTracking,
  isFullyPaid,
  matchesFulfillmentFilter,
} from "./adminFulfillment";
import type { OrderListRow } from "./orderListTypes";

const base: OrderListRow = {
  orderId: "O-1",
  queryId: "Q-1",
  status: "DESIGN_APPROVED",
  balanceAmount: 400,
  advancePayment: 100,
  fullPayment: 500,
  paymentStatus: "ADVANCE_RECEIVED",
};

describe("adminFulfillment", () => {
  it("suggests print action for design approved", () => {
    expect(fulfillmentQueueAction(base)).toBe("Mark print done");
    expect(canUploadPrintImage(base)).toBe(false);
    expect(canMarkPrintDone(base)).toBe(true);
    expect(canMarkFrameReady(base)).toBe(false);
    expect(canWhatsAppPrint(base)).toBe(true);
  });

  it("requires framed photo during in print", () => {
    const inPrint = { ...base, status: "IN_PRINT" };
    expect(fulfillmentQueueAction(inPrint)).toBe("Mark frame ready");
    expect(canUploadPrintImage(inPrint)).toBe(true);
    expect(canMarkPrintDone(inPrint)).toBe(false);
    expect(canMarkFrameReady(inPrint)).toBe(false);
    expect(
      canMarkFrameReady({ ...inPrint, printedFrameImage: "orders/x/print.jpg" }),
    ).toBe(true);
    expect(
      canMarkFrameReady(
        {
          ...inPrint,
          lines: [
            { lineItemId: "li-1", frameSize: "5x7", quantity: 1, sortOrder: 0 },
            { lineItemId: "li-2", frameSize: "8x5", quantity: 1, sortOrder: 1 },
          ],
        },
        [
          { id: "a1", orderId: "O", lineItemId: "li-1", r2Key: "k/1.jpg", assetType: "PRINT_PROOF", isFinal: false },
        ],
      ),
    ).toBe(false);
    expect(
      canMarkFrameReady(
        {
          ...inPrint,
          lines: [
            { lineItemId: "li-1", frameSize: "5x7", quantity: 1, sortOrder: 0 },
            { lineItemId: "li-2", frameSize: "8x5", quantity: 1, sortOrder: 1 },
          ],
        },
        [
          { id: "a1", orderId: "O", lineItemId: "li-1", r2Key: "k/1.jpg", assetType: "PRINT_PROOF", isFinal: false },
          { id: "a2", orderId: "O", lineItemId: "li-2", r2Key: "k/2.jpg", assetType: "PRINT_PROOF", isFinal: false },
        ],
      ),
    ).toBe(true);
  });

  it("tracks step states through workflow", () => {
    const inPrint = { ...base, status: "IN_PRINT" };
    expect(fulfillmentStepStates(inPrint).frameReady).toBe("active");
    const frameReady = { ...base, status: "FRAME_READY", printStage: "DONE" };
    expect(fulfillmentStepStates(frameReady).balance).toBe("active");
    const paid = {
      ...frameReady,
      balanceAmount: 0,
      paymentStatus: "FULLY_PAID",
      status: "PAYMENT_COMPLETED",
    };
    expect(isFullyPaid(paid)).toBe(true);
    expect(canDispatch(paid)).toBe(true);
    expect(fulfillmentStepStates(paid).dispatch).toBe("active");
    expect(canWhatsAppDispatch(paid)).toBe(false);
    const trackingSaved = { ...paid, trackingNumber: "TRK-1" };
    expect(hasSavedTracking(trackingSaved)).toBe(true);
    expect(canWhatsAppDispatch(trackingSaved)).toBe(true);
    const completed = {
      ...paid,
      status: "ORDER_COMPLETED",
      trackingNumber: "TRK-1",
    };
    expect(canWhatsAppDispatch(completed)).toBe(false);
    expect(canWhatsAppPrint(completed)).toBe(false);
    expect(canWhatsAppPrint(frameReady)).toBe(true);
  });

  it("filters production queue buckets", () => {
    expect(matchesFulfillmentFilter(base, "print_due")).toBe(true);
    expect(matchesFulfillmentFilter(base, "frame_due")).toBe(false);
    expect(matchesFulfillmentFilter(base, "awaiting_payment")).toBe(false);
    const inPrint = { ...base, status: "IN_PRINT" };
    expect(matchesFulfillmentFilter(inPrint, "frame_due")).toBe(true);
    const frameReady = { ...base, status: "FRAME_READY", printStage: "DONE" };
    expect(matchesFulfillmentFilter(frameReady, "awaiting_payment")).toBe(true);
    expect(canCollectBalance(frameReady)).toBe(true);
    expect(hasPrintImage(frameReady)).toBe(false);
  });
});
