"use server";

import { updateMember } from "@/lib/members";
import { createArea } from "@/lib/areas";
import { revalidatePath } from "next/cache";

export async function createAreaAction(name: string) {
  const area = await createArea(name);
  revalidatePath("/app/members");
  revalidatePath("/app/members/new");
  return area;
}

// Below this length a typed area is almost always a typo/stray keystroke
// (e.g. a lone letter left in the field), not a real place name — skip
// creating it and leave the member's area empty rather than polluting the
// area list.
const MIN_AREA_NAME_LENGTH = 3;

export async function resolveAreaId(formData: FormData): Promise<string | undefined> {
  const areaId = (formData.get("areaId") as string) || undefined;
  if (areaId) return areaId;

  const areaText = ((formData.get("areaText") as string) || "").trim();
  if (areaText.length < MIN_AREA_NAME_LENGTH) return undefined;

  const area = await createAreaAction(areaText);
  return area.id;
}

export async function updateMemberAction(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const heightRaw = formData.get("height") as string;
  const weightRaw = formData.get("weight") as string;

  const areaId = await resolveAreaId(formData);

  await updateMember(memberId, {
    fullName: (formData.get("fullName") as string) || undefined,
    homeBranchId: (formData.get("homeBranchId") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    joinDate: (formData.get("joinDate") as string) || undefined,
    sex: (formData.get("sex") as "male" | "female") || undefined,
    idNumber: (formData.get("idNumber") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    areaId,
    height: heightRaw ? Number(heightRaw) : undefined,
    weight: weightRaw ? Number(weightRaw) : undefined,
    registeredEmployeeId: (formData.get("registeredEmployeeId") as string) || undefined,
    emergencyContactName: (formData.get("emergencyContactName") as string) || undefined,
    emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || undefined,
    medicalNotes: (formData.get("medicalNotes") as string) || undefined,
  });

  revalidatePath("/app/members");
}
