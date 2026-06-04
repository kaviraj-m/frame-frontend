import { describe, expect, it } from "vitest";
import {
  classifyAuditActionForExport,
  formatContributorList,
} from "./orderAuditContributors";

describe("classifyAuditActionForExport", () => {
  it("maps executive flow actions", () => {
    expect(classifyAuditActionForExport("order.confirmed", "EXECUTIVE")).toBe("executive");
    expect(
      classifyAuditActionForExport("order.asset_uploaded", "EXECUTIVE", { assetKind: "customer" }),
    ).toBe("executive");
  });

  it("maps designer flow actions", () => {
    expect(classifyAuditActionForExport("order.design_taken", "DESIGNER")).toBe("designer");
    expect(
      classifyAuditActionForExport("order.asset_uploaded", "DESIGNER", { assetKind: "preview" }),
    ).toBe("designer");
  });

  it("maps production and dispatch actions", () => {
    expect(classifyAuditActionForExport("order.print_done", "ADMIN")).toBe("production");
    expect(classifyAuditActionForExport("order.admin_patch", "ADMIN")).toBe("production");
    expect(
      classifyAuditActionForExport("order.asset_uploaded", "EXECUTIVE", { assetKind: "print-proof" }),
    ).toBe("production");
  });

  it("skips unrelated actions", () => {
    expect(classifyAuditActionForExport("order.deleted", "ADMIN")).toBeNull();
  });
});

describe("formatContributorList", () => {
  it("joins unique names with comma", () => {
    expect(formatContributorList(["rahul", "priya"])).toBe("rahul, priya");
    expect(formatContributorList([])).toBe("");
  });
});
