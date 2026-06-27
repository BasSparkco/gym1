import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api";

type Params = { params: Promise<{ branchId: string }> };

async function proxy(method: string, branchId: string): Promise<NextResponse> {
  const cookieStore = await cookies();
  const res = await fetch(
    `${apiBase}/tenancy/whatsapp/branches/${encodeURIComponent(branchId)}`,
    { method, headers: { cookie: cookieStore.toString() } },
  );
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(_req: Request, { params }: Params) {
  const { branchId } = await params;
  return proxy("PUT", branchId);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { branchId } = await params;
  return proxy("DELETE", branchId);
}
