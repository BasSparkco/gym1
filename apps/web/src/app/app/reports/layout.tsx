import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function ReportsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  return children;
}
