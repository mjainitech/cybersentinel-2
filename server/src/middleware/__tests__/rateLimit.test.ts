import { describe, it, expect, vi } from "vitest";
import { rateLimit } from "../rateLimit";
import type { Request, Response, NextFunction } from "express";

function makeReq(userId: string): Request {
  return { userId, ip: "127.0.0.1" } as unknown as Request;
}

function makeRes(): { res: Response; statusMock: ReturnType<typeof vi.fn>; jsonMock: ReturnType<typeof vi.fn> } {
  const jsonMock = vi.fn();
  const statusMock = vi.fn(() => ({ json: jsonMock }));
  return { res: { status: statusMock } as unknown as Response, statusMock, jsonMock };
}

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 3, message: "Too many requests." });
    const next = vi.fn();
    const { res } = makeRes();

    middleware(makeReq("user-1"), res, next as NextFunction);
    middleware(makeReq("user-1"), res, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("blocks requests once the limit is exceeded, with a 429 and the provided message", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 2, message: "Slow down." });
    const next = vi.fn();
    const { res, statusMock, jsonMock } = makeRes();

    middleware(makeReq("user-2"), res, next as NextFunction);
    middleware(makeReq("user-2"), res, next as NextFunction);
    middleware(makeReq("user-2"), res, next as NextFunction); // 3rd request exceeds max of 2

    expect(next).toHaveBeenCalledTimes(2);
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Slow down." });
  });

  it("tracks limits independently per user — one user's usage never affects another's", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 1, message: "Limited." });
    const next = vi.fn();
    const { res } = makeRes();

    middleware(makeReq("user-a"), res, next as NextFunction);
    middleware(makeReq("user-b"), res, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("falls back to IP when no authenticated userId is present", () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 1, message: "Limited." });
    const next = vi.fn();
    const { res, statusMock } = makeRes();

    const guestReq = { ip: "10.0.0.1" } as unknown as Request;
    middleware(guestReq, res, next as NextFunction);
    middleware(guestReq, res, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(429);
  });
});
