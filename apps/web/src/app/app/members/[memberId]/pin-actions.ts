"use server";

import { getMemberPin, resendMemberPin, setMemberPin, type PinDispatchResult } from "@/lib/members";
import { requireSession } from "@/lib/session";

function errorMessage(err: unknown): string {
  let message = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(message) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    // not JSON, use as-is
  }
  return message;
}

export async function getCurrentPinAction(memberId: string): Promise<{ pin: string | null }> {
  await requireSession();
  return getMemberPin(memberId);
}

export async function resendPinAction(
  memberId: string,
): Promise<PinDispatchResult | { error: string }> {
  await requireSession();
  try {
    return await resendMemberPin(memberId);
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function setNewPinAction(
  memberId: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  try {
    await setMemberPin(memberId, pin);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
