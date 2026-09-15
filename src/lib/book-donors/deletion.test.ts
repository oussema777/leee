import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteDonor: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { bookDonor: { delete: mocks.deleteDonor } } }));
vi.mock("@/lib/auth", () => ({ verifyToken: mocks.verifyToken }));

import { DELETE } from "@/app/api/admin/book-donors/[id]/route";

function deleteRequest(token: string | null = "review-token") {
  return new NextRequest("http://localhost/api/admin/book-donors/donor-1", {
    method: "DELETE",
    headers: token ? { cookie: `admin-token=${token}` } : {},
  });
}

const params = () => ({ params: Promise.resolve({ id: "donor-1" }) });
const databaseError = (code: string) => new Prisma.PrismaClientKnownRequestError("Database error", {
  code,
  clientVersion: "6.19.2",
});

describe("book donor deletion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.verifyToken.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  });

  it("deletes the requested donor for an authenticated admin", async () => {
    mocks.deleteDonor.mockResolvedValue({ id: "donor-1" });

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.deleteDonor).toHaveBeenCalledExactlyOnceWith({
      where: { id: "donor-1" },
      select: { id: true },
    });
  });

  it("rejects deletion without an admin session", async () => {
    const response = await DELETE(deleteRequest(null), params());

    expect(response.status).toBe(401);
    expect(mocks.deleteDonor).not.toHaveBeenCalled();
  });

  it("reports a missing donor", async () => {
    mocks.deleteDonor.mockRejectedValue(databaseError("P2025"));

    const response = await DELETE(deleteRequest(), params());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Donor not found" });
  });
});
