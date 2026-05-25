import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { resolveRegistrationPrice } from "./event-utils";

function event(overrides: Partial<Parameters<typeof resolveRegistrationPrice>[0]> = {}) {
  return {
    clubId: "club_1",
    basePrice: new Prisma.Decimal("100"),
    memberPrice: null,
    guestPrice: null,
    membersPay: true,
    nonMembersPay: true,
    ...overrides,
  };
}

describe("resolveRegistrationPrice", () => {
  it("charges members base price by default", () => {
    expect(resolveRegistrationPrice(event(), true)).toBe(100);
  });

  it("charges guests base price by default", () => {
    expect(resolveRegistrationPrice(event(), false)).toBe(100);
  });

  it("returns zero for members when membersPay is false", () => {
    expect(resolveRegistrationPrice(event({ membersPay: false }), true)).toBe(0);
  });

  it("returns zero for guests when nonMembersPay is false", () => {
    expect(resolveRegistrationPrice(event({ nonMembersPay: false }), false)).toBe(0);
  });

  it("uses memberPrice override for members", () => {
    expect(
      resolveRegistrationPrice(event({ memberPrice: new Prisma.Decimal("50") }), true),
    ).toBe(50);
  });

  it("uses guestPrice override for guests", () => {
    expect(
      resolveRegistrationPrice(event({ guestPrice: new Prisma.Decimal("75") }), false),
    ).toBe(75);
  });

  it("free base with both flags false yields zero for member", () => {
    expect(
      resolveRegistrationPrice(
        event({
          basePrice: new Prisma.Decimal("0"),
          membersPay: false,
          nonMembersPay: true,
        }),
        true,
      ),
    ).toBe(0);
  });
});
