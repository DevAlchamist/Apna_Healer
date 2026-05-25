import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, { status: 201, ...init });
}

export function failure(status: number, message: string, code = "REQUEST_FAILED") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          issues: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (isApiError(error)) {
    return failure(error.status, error.message, error.code);
  }

  console.error(error);

  return failure(500, "An unexpected server error occurred.", "INTERNAL_SERVER_ERROR");
}

export function assertCondition(
  condition: unknown,
  status: number,
  message: string,
  code?: string,
): asserts condition {
  if (!condition) {
    throw new ApiError(status, message, code);
  }
}
