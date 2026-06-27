import { listMembers } from "@/lib/members";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 1) return NextResponse.json({ members: [] });

  try {
    const all = await listMembers();
    const members = all
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberNumber.toLowerCase().includes(q) ||
          (m.phone && m.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))) ||
          (m.idNumber && m.idNumber.toLowerCase().includes(q)),
      )
      .slice(0, 8)
      .map(({ id, fullName, memberNumber, status }) => ({
        id,
        fullName,
        memberNumber,
        status,
      }));
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ members: [] });
  }
}
