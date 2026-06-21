import { describe, expect, it } from "vitest";
import {
  buildShippingLabelHtml,
  canPrintShippingLabel,
  estimateAddressLineCount,
  resolveLabelDensityTier,
} from "./printShippingLabel";

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
    expect(html).toContain('class="block block-from"');
    expect(html).toContain('class="block block-to"');
    expect(html).toContain(".block-from");
    expect(html).toContain(".block-to");
    expect(html).toContain("margin-left: auto");
    expect(html).toContain("--label-scale");
    expect(html).toContain("fitLabelScale");
    expect(html).toContain('data-scale-min="');
    expect(html).toContain('class="label-main"');
    expect(html).toContain('class="label-spacer"');
    expect(html).toContain("window.print");
    expect(html).toContain("Shop");
    expect(html).toContain("Client");
    expect(html).toContain("Pincode : 111111");
    expect(html).toContain("Pincode : 222222");
    expect(html).not.toContain('class="label-footer"');
  });

  it("includes centered footer when labelFooter is set", () => {
    const html = buildShippingLabelHtml({
      orderId: "C26052",
      from: {
        name: "Shop",
        phone: "1",
        address: "From St",
        pincode: "111111",
        labelFooter: "Memorix Frames\nHandle with care",
      },
      to: { name: "Client", phone: "2", address: "To St", pincode: "222222" },
    });
    expect(html).toContain('class="label-footer"');
    expect(html).toContain("has-footer");
    expect(html).toContain('class="label-spacer"');
    expect(html).toContain("Memorix Frames");
    expect(html).toContain("Handle with care");
    expect(html).toContain("Memorix Frames<br/>Handle with care");
  });

  it("omits footer when labelFooter is blank", () => {
    const html = buildShippingLabelHtml({
      orderId: "C26052",
      from: { name: "Shop", phone: "1", address: "From St", pincode: "111111", labelFooter: "   " },
      to: { name: "Client", phone: "2", address: "To St", pincode: "222222" },
    });
    expect(html).not.toContain('class="label-footer"');
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

  it("estimates wrapped address lines", () => {
    expect(estimateAddressLineCount("short")).toBe(1);
    expect(estimateAddressLineCount("a".repeat(70))).toBe(4);
    expect(estimateAddressLineCount("line one\nline two\nline three")).toBe(3);
  });

  it("omits auto-print from download HTML", () => {
    const html = buildShippingLabelHtml(
      {
        orderId: "C26052",
        from: { name: "Shop", phone: "1", address: "From St", pincode: "111111" },
        to: { name: "Client", phone: "2", address: "To St", pincode: "222222" },
      },
      { autoPrint: false },
    );
    expect(html).not.toContain("window.print");
    expect(html).toContain("fitLabelScale");
  });

  it("uses compact or tight density for long addresses", () => {
    const longFrom = {
      name: "Kaviraj Tamilan",
      phone: "07904612266",
      address: "3/359 Puthur Nesavalar Kalani,\nThokkavadi,\nKuchipalayaim,\nTiruchengode,\nnamakkal.\ntamilnadu.",
      pincode: "637215",
    };
    expect(resolveLabelDensityTier(longFrom, { name: "c", phone: "1", address: "x", pincode: "1" })).toBe("tight");

    const html = buildShippingLabelHtml({
      orderId: "C26052",
      from: longFrom,
      to: { name: "Client", phone: "2", address: "To St", pincode: "222222" },
    });
    expect(html).toContain('class="label density-tight"');
  });
});
