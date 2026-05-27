import { describe, expect, it } from "vitest";
import { formatOrderFrameLabel, mergeOrderFromApi } from "./orderListTypes";

describe("mergeOrderFromApi", () => {
  const lines = [
    { lineItemId: "li-1", frameSize: "5x7", quantity: 1, sortOrder: 0 },
    { lineItemId: "li-2", frameSize: "8x10", quantity: 1, sortOrder: 1 },
  ];

  it("keeps previous lines when the API response omits them", () => {
    const prev = { orderId: "O-1", queryId: "Q-1", status: "IN_PRINT", lines };
    const next = { orderId: "O-1", queryId: "Q-1", status: "FRAME_READY" };
    expect(mergeOrderFromApi(prev, next).lines).toEqual(lines);
  });

  it("prefers lines from the API when present", () => {
    const prev = { orderId: "O-1", queryId: "Q-1", status: "IN_PRINT", lines };
    const updated = [
      { lineItemId: "li-1", frameSize: "5x7", quantity: 2, sortOrder: 0 },
    ];
    const next = { orderId: "O-1", queryId: "Q-1", status: "IN_PRINT", lines: updated };
    expect(mergeOrderFromApi(prev, next).lines).toEqual(updated);
  });
});

describe("formatOrderFrameLabel", () => {
  it("uses frameSize when no lines", () => {
    expect(formatOrderFrameLabel({ frameSize: "12x18" })).toBe("12x18");
  });

  it("formats multiple lines with quantity", () => {
    expect(
      formatOrderFrameLabel({
        frameSize: "12x18, 8x10",
        lines: [
          { lineItemId: "a", frameSize: "8x10", quantity: 2, sortOrder: 1 },
          { lineItemId: "b", frameSize: "12x18", quantity: 1, sortOrder: 0 },
        ],
      }),
    ).toBe("12x18, 8x10 ×2");
  });
});
