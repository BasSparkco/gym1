"use server";

import { updateBranch } from "@/lib/branches";
import { revalidatePath } from "next/cache";

export async function updateBranchAction(formData: FormData) {
  const branchId = formData.get("branchId") as string;

  await updateBranch(branchId, {
    name: (formData.get("name") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
    operatingCurrencyCode: (formData.get("operatingCurrencyCode") as string) || undefined,
    status: formData.get("status") as "active" | "inactive",
  });

  revalidatePath("/app/branches");
  revalidatePath(`/app/branches/${branchId}`);
}
