import "server-only";

import { apiBaseUrl, SessionUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type CurrentSessionResponse = {
  user: SessionUser;
};

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/auth/current-session`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load the current session.");
  }

  const payload = (await response.json()) as CurrentSessionResponse;

  return payload.user;
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/signin");
  }

  return session;
}