import { describe, expect, it } from "vitest";
import { buildShippingLabelHtml, canPrintShippingLabel } from "./printShippingLabel";

describe("printShippingLabel", () => {
  it("includes order id and from/to blocks", () => {
    const html = buildShippingLabelHtml({
      orderId: "C26052",
      from: { name: "Shop", phone: "1", address: "From St", pincode: "111111" },
      to: { name: "Client", phone: "2", address: "To St", pincode: "222222" },
    });
    expect(html).toContain("Order C26052");
    expect(html).toContain(">From</h2>");
    expect(html).toContain(">To</h2>");
    expect(html).toContain("size: A6 portrait");
    expect(html).toContain("min-height: 100vh");
    expect(html).toContain('class="sections"');
    expect(html).toContain("window.print");
    expect(html).toContain("Shop");
    expect(html).toContain("Client");
  });

  it("requires configured from and client name/address", () => {
    expect(
      canPrintShippingLabel(
        { name: "S", phone: "1", address: "a", pincode: "1" },
        { name: "C", phone: "", address: "addr", pincode: "" },
      ),
    ).toBe(true);
    expect(canPrintShippingLabel({ name: "", phone: "", address: "", pincode: "" }, { name: "C", phone: "", address: "a", pincode: "" })).toBe(false);
  });
});
