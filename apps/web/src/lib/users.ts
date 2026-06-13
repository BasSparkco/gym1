import "server-only";

import { apiBaseUrl, type UserRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type StaffUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  tenant: { id: string; name: string };
  branch: { id: string; name: string };
};

export type Role = {
  id: string;
  label: string;
  description: string;
};

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore.toString();
}

async function authedFetch(path: string, init?: RequestInit) {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/signin");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export async function listUsers(): Promise<StaffUser[]> {
  const response = await authedFetch("/users");
  const payload = (await response.json()) as { users: StaffUser[] };
  return payload.users;
}

export async function getUser(userId: string): Promise<StaffUser> {
  const response = await authedFetch(`/users/${userId}`);
  const payload = (await response.json()) as { user: StaffUser };
  return payload.user;
}

export async function createUser(data: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
  branchId: string;
  branchName: string;
}): Promise<StaffUser> {
  const response = await authedFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { user: StaffUser };
  return payload.user;
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    role?: UserRole;
    branchId?: string;
    branchName?: string;
    password?: string;
  }
): Promise<StaffUser> {
  const response = await authedFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { user: StaffUser };
  return payload.user;
}

export async function listRoles(): Promise<Role[]> {
  const response = await authedFetch("/roles");
  const payload = (await response.json()) as { roles: Role[] };
  return payload.roles;
}
