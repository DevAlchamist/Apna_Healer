import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: getTokenMock,
}));

import { middleware } from "./middleware";

function buildRequest(pathname: string): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  return {
    nextUrl: url,
    url: url.toString(),
  } as unknown as NextRequest;
}

function locationHeader(response: Response | undefined) {
  expect(response).toBeDefined();
  const location = response!.headers.get("location");
  expect(location).toBeTruthy();
  return new URL(location as string);
}

describe("middleware access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests to the landing page with a next param", async () => {
    getTokenMock.mockResolvedValue(null);

    const response = await middleware(buildRequest("/dashboard"));
    const target = locationHeader(response);

    expect(target.pathname).toBe("/");
    expect(target.searchParams.get("next")).toBe("/dashboard");
  });

  it("redirects non-admin members away from /admin paths", async () => {
    getTokenMock.mockResolvedValue({ sub: "user_1", role: Role.USER });

    const response = await middleware(buildRequest("/admin/users"));
    const target = locationHeader(response);

    expect(target.pathname).toBe("/dashboard");
  });

  it("allows admins to reach /admin paths", async () => {
    getTokenMock.mockResolvedValue({ sub: "admin_1", role: Role.ADMIN });

    const response = await middleware(buildRequest("/admin/users"));

    expect(response?.headers.get("location")).toBeNull();
  });

  it("redirects admins from /dashboard back to /admin", async () => {
    getTokenMock.mockResolvedValue({ sub: "admin_1", role: Role.ADMIN });

    const response = await middleware(buildRequest("/dashboard"));
    const target = locationHeader(response);

    expect(target.pathname).toBe("/admin");
  });

  it("lets members and providers stay on /dashboard", async () => {
    getTokenMock.mockResolvedValue({ sub: "user_1", role: Role.USER });
    const userResponse = await middleware(buildRequest("/dashboard"));
    expect(userResponse?.headers.get("location")).toBeNull();

    getTokenMock.mockResolvedValue({ sub: "therapist_1", role: Role.THERAPIST });
    const therapistResponse = await middleware(buildRequest("/dashboard/consultations"));
    expect(therapistResponse?.headers.get("location")).toBeNull();

    getTokenMock.mockResolvedValue({ sub: "listener_1", role: Role.LISTENER });
    const listenerResponse = await middleware(buildRequest("/dashboard/wallet"));
    expect(listenerResponse?.headers.get("location")).toBeNull();
  });
});
