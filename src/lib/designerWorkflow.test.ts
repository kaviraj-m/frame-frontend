import { describe, expect, it } from "vitest";
import {
  canUploadPreview,
  designerQueueAction,
  designerStepStates,
  matchesDesignerFilter,
  sortQueueOrders,
} from "./designerWorkflow";
import type { OrderListRow } from "./orderListTypes";

function row(status: string, orderId: string): OrderListRow {
  return {
    orderId,
    queryId: "Q1",
    status,
  };
}

describe("designerWorkflow", () => {
  it("sorts revision before confirmed", () => {
    const sorted = sortQueueOrders([
      row("ORDER_CONFIRMED", "A"),
      row("DESIGN_REVISION_REQUIRED", "B"),
      row("IN_DESIGN", "C"),
    ]);
    expect(sorted.map((o) => o.orderId)).toEqual(["B", "A", "C"]);
  });

  it("maps queue actions", () => {
    expect(designerQueueAction("ORDER_CONFIRMED")).toBe("Take order");
    expect(designerQueueAction("IN_DESIGN")).toBe("Upload preview");
  });

  it("filters by status bucket", () => {
    expect(matchesDesignerFilter("IN_DESIGN", "in_design")).toBe(true);
    expect(matchesDesignerFilter("ORDER_CONFIRMED", "revision")).toBe(false);
  });

  it("upload only after take", () => {
    expect(canUploadPreview("ORDER_CONFIRMED")).toBe(false);
    expect(canUploadPreview("IN_DESIGN")).toBe(true);
  });

  it("step states for in-design order", () => {
    const steps = designerStepStates("IN_DESIGN");
    expect(steps.take).toBe("done");
    expect(steps.preview).toBe("active");
    expect(steps.signoff).toBe("locked");
  });
});
