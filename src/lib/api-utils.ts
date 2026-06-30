import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Authenticate admin and return session or error response
export async function withAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
  return { session: payload };
}

// Authenticate AND require SUPER_ADMIN role
export async function withSuperAdmin(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth;
  if (auth.session.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}

// Extract pagination & search params from URL
export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = (url.searchParams.get("order") || "desc") as "asc" | "desc";
  const skip = (page - 1) * limit;

  return { page, limit, search, sort, order, skip };
}

// Build paginated response
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// Standard error response
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
