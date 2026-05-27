import { describe, expect, it } from "vitest";
import { isProductionDispatchQueueStatus } from "./orderStatusGroups";

describe("isProductionDispatchQueueStatus", () => {
  it("excludes completed and returned", () => {
    expect(isProductionDispatchQueueStatus("DESIGN_APPROVED")).toBe(true);
    expect(isProductionDispatchQueueStatus("DISPATCHED")).toBe(true);
    expect(isProductionDispatchQueueStatus("ORDER_COMPLETED")).toBe(false);
    expect(isProductionDispatchQueueStatus("AMOUNT_RETURNED")).toBe(false);
  });
});
