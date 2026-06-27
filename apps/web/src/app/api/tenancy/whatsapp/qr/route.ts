import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api";

export async function GET() {
  const cookieStore = await cookies();
  const res = await fetch(`${apiBase}/tenancy/whatsapp/qr`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
