import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteBook: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { bookInventoryItem: { delete: mocks.deleteBook } } }));
vi.mock("@/lib/auth", () => ({ verifyToken: mocks.verifyToken }));

import { DELETE } from "@/app/api/admin/book-inventory/[id]/route";

function deleteRequest(token: string | null = "review-token") {
  return new NextRequest("http://localhost/api/admin/book-inventory/book-1", {
    method: "DELETE",
    headers: token ? { cookie: `admin-token=${token}` } : {},
  });
}

const params = () => ({ params: Promise.resolve({ id: "book-1" }) });
const databaseError = (code: string) => new Prisma.PrismaClientKnownRequestError("Database error", {
  code,
  clientVersion: "6.19.2",
});

describe("book inventory deletion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.verifyToken.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  });

  it("deletes only the requested book for an authenticated admin", async () => {
    mocks.deleteBook.mockResolvedValue({ id: "book-1" });

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.deleteBook).toHaveBeenCalledExactlyOnceWith({
      where: { id: "book-1" },
      select: { id: true },
    });
  });

  it("does not touch inventory without an admin session", async () => {
    const response = await DELETE(deleteRequest(null), params());

    expect(response.status).toBe(401);
    expect(mocks.verifyToken).not.toHaveBeenCalled();
    expect(mocks.deleteBook).not.toHaveBeenCalled();
  });

  it("does not touch inventory with an invalid or expired session", async () => {
    mocks.verifyToken.mockResolvedValue(null);

    const response = await DELETE(deleteRequest("expired"), params());

    expect(response.status).toBe(401);
    expect(mocks.deleteBook).not.toHaveBeenCalled();
  });

  it("reports a missing or already deleted book", async () => {
    mocks.deleteBook.mockRejectedValue(databaseError("P2025"));

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Book not found" });
  });

  it("preserves order history when the database blocks a linked book, including a concurrent order", async () => {
    mocks.deleteBook.mockRejectedValue(databaseError("P2003"));

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This book is linked to an order and cannot be deleted. Archive it instead to preserve order history.",
    });
    expect(mocks.deleteBook).toHaveBeenCalledTimes(1);
  });

  it("returns a retryable error without exposing database details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.deleteBook.mockRejectedValue(new Error("Private database connection details"));

      const response = await DELETE(deleteRequest(), params());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Failed to delete book. Please try again." });
    } finally {
      log.mockRestore();
    }
  });
});
