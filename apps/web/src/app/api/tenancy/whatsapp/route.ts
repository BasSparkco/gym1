import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api";

async function proxyToGymApi(method: string): Promise<NextResponse> {
  const cookieStore = await cookies();
  const res = await fetch(`${apiBase}/tenancy/whatsapp`, {
    method,
    headers: { cookie: cookieStore.toString() },
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT() {
  return proxyToGymApi("PUT");
}

export async function DELETE() {
  return proxyToGymApi("DELETE");
}
