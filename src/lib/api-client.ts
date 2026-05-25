"use client";

import { signOut } from "next-auth/react";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    issues?: unknown;
  };
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: unknown;

  constructor(status: number, message: string, code = "REQUEST_FAILED", issues?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

let sessionExpiredSignOutPromise: Promise<void> | null = null;

function signOutBecauseSessionExpired() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (!sessionExpiredSignOutPromise) {
    sessionExpiredSignOutPromise = (async () => {
      try {
        await signOut({ callbackUrl: "/", redirect: true });
      } catch {
        window.location.assign("/");
      } finally {
        sessionExpiredSignOutPromise = null;
      }
    })();
  }
  return sessionExpiredSignOutPromise;
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || !("success" in payload) || !payload.success) {
    const error =
      payload && "error" in payload
        ? payload.error
        : {
            code: "REQUEST_FAILED",
            message: response.statusText || "Request failed.",
            issues: undefined,
          };

    if (response.status === 401) {
      await signOutBecauseSessionExpired();
    }

    throw new ApiClientError(response.status, error.message, error.code, error.issues);
  }

  return payload.data;
}

export async function apiMutation<T>(
  input: RequestInfo | URL,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
) {
  return apiFetch<T>(input, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
