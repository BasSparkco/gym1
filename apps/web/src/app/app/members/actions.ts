"use server";

import { updateMember } from "@/lib/members";
import { revalidatePath } from "next/cache";

export async function updateMemberAction(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const heightRaw = formData.get("height") as string;
  const weightRaw = formData.get("weight") as string;

  await updateMember(memberId, {
    fullName: (formData.get("fullName") as string) || undefined,
    homeBranchId: (formData.get("homeBranchId") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    sex: (formData.get("sex") as "male" | "female") || undefined,
    idNumber: (formData.get("idNumber") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    height: heightRaw ? Number(heightRaw) : undefined,
    weight: weightRaw ? Number(weightRaw) : undefined,
    registeredEmployeeId: (formData.get("registeredEmployeeId") as string) || undefined,
    emergencyContactName: (formData.get("emergencyContactName") as string) || undefined,
    emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || undefined,
    medicalNotes: (formData.get("medicalNotes") as string) || undefined,
    rfidTag: (formData.get("rfidTag") as string) || undefined,
  });

  revalidatePath("/app/members");
}
