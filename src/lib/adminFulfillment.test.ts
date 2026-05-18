import { describe, expect, it } from "vitest";
import {
  canDispatch,
  canMarkPrintDone,
  fulfillmentQueueAction,
  fulfillmentStepStates,
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
    expect(canMarkPrintDone(base)).toBe(true);
  });

  it("tracks step states through workflow", () => {
    const printed = { ...base, status: "IN_PRINT", printStage: "DONE" };
    expect(fulfillmentStepStates(printed).balance).toBe("active");
    const paid = { ...printed, balanceAmount: 0, paymentStatus: "FULLY_PAID", status: "PAYMENT_COMPLETED" };
    expect(isFullyPaid(paid)).toBe(true);
    expect(canDispatch(paid)).toBe(true);
    expect(fulfillmentStepStates(paid).dispatch).toBe("active");
  });

  it("filters production queue buckets", () => {
    expect(matchesFulfillmentFilter(base, "print_due")).toBe(true);
    expect(matchesFulfillmentFilter(base, "awaiting_payment")).toBe(false);
    const printed = { ...base, status: "IN_PRINT", printStage: "DONE" };
    expect(matchesFulfillmentFilter(printed, "awaiting_payment")).toBe(true);
  });
});
