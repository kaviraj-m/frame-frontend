import { describe, expect, it } from "vitest";
import { cataloguePrice } from "./framePricing";

describe("framePricing", () => {
  it("picks online or cash price from catalogue row", () => {
    const row = { frameSize: "12x18", onlinePrice: 520, cashPrice: 500 };
    expect(cataloguePrice(row, "CASH")).toBe(500);
    expect(cataloguePrice(row, "ONLINE")).toBe(520);
  });
});
