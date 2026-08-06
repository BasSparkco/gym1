import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Conversation = {
  memberId: string;
  memberName: string;
  memberNumber: string;
  lastMessageBody: string;
  lastMessageAt: string;
  unreadCount: number;
};

async function authedFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (response.status === 401) redirect("/signin");

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await authedFetch("/messages/conversations");
  const payload = (await res.json()) as { conversations: Conversation[] };
  return payload.conversations;
}

export async function getUnreadConversationCount(): Promise<number> {
  const res = await authedFetch("/messages/conversations/unread-count");
  const payload = (await res.json()) as { unreadCount: number };
  return payload.unreadCount;
}
