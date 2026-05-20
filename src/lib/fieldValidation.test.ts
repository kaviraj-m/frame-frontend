import { describe, expect, it } from "vitest";
import {
  firstError,
  phoneDigits,
  validateEmailOptional,
  validatePhone10,
  validatePositiveNumber,
  validateRemarkOrImage,
  validateRequired,
} from "./fieldValidation";

describe("fieldValidation", () => {
  describe("phoneDigits / validatePhone10", () => {
    it("strips formatting and validates 10 digits", () => {
      expect(phoneDigits("+91 98765 43210")).toBe("919876543210");
      expect(validatePhone10("9876543210")).toBeNull();
      expect(validatePhone10("98765 43210")).toBeNull();
      expect(validatePhone10("+91 9876543210")).toBe("Phone must be exactly 10 digits.");
    });

    it("rejects 9 and 11 digit numbers", () => {
      expect(validatePhone10("987654321")).toBe("Phone must be exactly 10 digits.");
      expect(validatePhone10("98765432101")).toBe("Phone must be exactly 10 digits.");
    });

    it("rejects empty", () => {
      expect(validatePhone10("")).toBe("Phone must be exactly 10 digits.");
    });
  });

  describe("validateEmailOptional", () => {
    it("accepts empty", () => {
      expect(validateEmailOptional("")).toBeNull();
      expect(validateEmailOptional("   ")).toBeNull();
    });

    it("rejects invalid", () => {
      expect(validateEmailOptional("not-an-email")).toBe("Enter a valid email address.");
      expect(validateEmailOptional("a@")).toBe("Enter a valid email address.");
    });

    it("accepts valid", () => {
      expect(validateEmailOptional("user@example.com")).toBeNull();
      expect(validateEmailOptional("name+tag@domain.co.in")).toBeNull();
    });
  });

  describe("validateRequired", () => {
    it("rejects whitespace-only", () => {
      expect(validateRequired("   ", "Name")).toBe("Name is required.");
    });

    it("accepts non-empty trim", () => {
      expect(validateRequired(" hello ", "Name")).toBeNull();
    });
  });

  describe("validatePositiveNumber", () => {
    it("rejects zero and invalid", () => {
      expect(validatePositiveNumber("0", "Amount")).toBe("Enter a valid amount.");
      expect(validatePositiveNumber("", "Amount")).toBe("Enter a valid amount.");
      expect(validatePositiveNumber("abc", "Amount")).toBe("Enter a valid amount.");
    });

    it("accepts positive", () => {
      expect(validatePositiveNumber("100", "Amount")).toBeNull();
      expect(validatePositiveNumber("0.01", "Amount")).toBeNull();
    });
  });

  describe("firstError", () => {
    it("returns first error", () => {
      expect(firstError(null, "a", "b")).toBe("a");
      expect(firstError(null, null)).toBeNull();
    });
  });

  describe("validateRemarkOrImage", () => {
    it("requires remark or image", () => {
      expect(validateRemarkOrImage("", false)).toBe("Enter a remark and/or choose an image.");
      expect(validateRemarkOrImage("  ", false)).toBe("Enter a remark and/or choose an image.");
      expect(validateRemarkOrImage("", true)).toBeNull();
      expect(validateRemarkOrImage("note", false)).toBeNull();
    });
  });
});
