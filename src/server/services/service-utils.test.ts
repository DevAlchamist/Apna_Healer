import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  PLATFORM_FEE_RATE,
  decimalToNumber,
  mergeDateAndTime,
  toDecimal,
} from "@/server/services/service-utils";

describe("service utilities", () => {
  it("keeps the platform fee rate stable", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.15);
  });

  it("converts values to Prisma decimals and back to numbers", () => {
    expect(toDecimal("12.34")).toBeInstanceOf(Prisma.Decimal);
    expect(toDecimal("12.34").toString()).toBe("12.34");
    expect(decimalToNumber(new Prisma.Decimal("45.67"))).toBe(45.67);
  });

  it("merges a local date with an hh:mm time string without mutating the source date", () => {
    const source = new Date(2026, 4, 13, 0, 0, 0, 0);

    const merged = mergeDateAndTime(source, "09:30");

    expect(merged).not.toBe(source);
    expect(source.getHours()).toBe(0);
    expect(source.getMinutes()).toBe(0);
    expect(merged.getFullYear()).toBe(2026);
    expect(merged.getMonth()).toBe(4);
    expect(merged.getDate()).toBe(13);
    expect(merged.getHours()).toBe(9);
    expect(merged.getMinutes()).toBe(30);
  });
});
