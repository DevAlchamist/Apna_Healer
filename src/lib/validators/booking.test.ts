import { describe, expect, it } from "vitest";
import { moneyAmountSchema } from "@/lib/validators/common";
import { bookingQuerySchema, createBookingSchema } from "@/lib/validators/booking";

describe("booking validation", () => {
  it("accepts money amounts with up to two decimal places", () => {
    expect(moneyAmountSchema.parse(199.99)).toBe(199.99);
    expect(() => moneyAmountSchema.parse(199.999)).toThrow(
      /Amount must have at most two decimal places\./,
    );
  });

  it("coerces booking query pagination values", () => {
    expect(
      bookingQuerySchema.parse({
        scope: "provider",
        take: "12",
      }),
    ).toEqual({
      scope: "provider",
      take: 12,
    });
  });

  it("parses valid booking payloads and trims optional notes", () => {
    const result = createBookingSchema.parse({
      providerId: "provider_123",
      type: "THERAPIST",
      requestedDate: "2026-05-13T10:00:00.000Z",
      requestedTime: "10:00",
      duration: "60",
      amount: 499.5,
      note: "  Need support with burnout  ",
    });

    expect(result.duration).toBe(60);
    expect(result.note).toBe("Need support with burnout");
  });

  it("rejects booking payloads with invalid money precision", () => {
    expect(() =>
      createBookingSchema.parse({
        providerId: "provider_123",
        type: "THERAPIST",
        requestedDate: "2026-05-13T10:00:00.000Z",
        requestedTime: "10:00",
        duration: 60,
        amount: 499.555,
      }),
    ).toThrow(/Amount must have at most two decimal places\./);
  });
});
