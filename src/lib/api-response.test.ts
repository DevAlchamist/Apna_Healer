import { ZodError, z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, isApiError } from "@/lib/api-errors";
import {
  assertCondition,
  created,
  failure,
  handleApiError,
  ok,
} from "@/lib/api-response";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api response helpers", () => {
  it("builds success responses with the expected status codes", async () => {
    const okResponse = ok({ id: "1" });
    const createdResponse = created({ id: "2" });

    await expect(okResponse.json()).resolves.toEqual({
      success: true,
      data: { id: "1" },
    });
    expect(okResponse.status).toBe(200);

    await expect(createdResponse.json()).resolves.toEqual({
      success: true,
      data: { id: "2" },
    });
    expect(createdResponse.status).toBe(201);
  });

  it("builds failure responses with structured error payloads", async () => {
    const response = failure(403, "Forbidden", "FORBIDDEN");

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden",
      },
    });
  });

  it("maps ApiError instances through the shared failure shape", async () => {
    const response = handleApiError(new ApiError(404, "Missing", "NOT_FOUND"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Missing",
      },
    });
  });

  it("maps zod validation errors to a 400 response", async () => {
    let validationError: ZodError;

    try {
      z.object({ amount: z.number().positive() }).parse({ amount: -1 });
      throw new Error("Expected validation to fail");
    } catch (error) {
      validationError = error as ZodError;
    }

    const response = handleApiError(validationError);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.message).toBe("Request validation failed.");
  });

  it("falls back to a 500 response for unknown errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = handleApiError(new Error("boom"));

    expect(consoleError).toHaveBeenCalled();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  });

  it("throws ApiError when asserted conditions fail", () => {
    expect(() => assertCondition(false, 401, "Nope", "UNAUTHORIZED")).toThrow(ApiError);
    expect(() => assertCondition(true, 401, "Nope", "UNAUTHORIZED")).not.toThrow();
  });

  it("identifies ApiError instances", () => {
    expect(isApiError(new ApiError(400, "Bad request"))).toBe(true);
    expect(isApiError(new Error("plain error"))).toBe(false);
  });
});
