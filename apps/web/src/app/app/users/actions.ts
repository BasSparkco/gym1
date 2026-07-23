"use server";

import { updateUser } from "@/lib/users";
import { revalidatePath } from "next/cache";

export async function linkEmployeeAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const employeeId = formData.get("employeeId") as string;
  await updateUser(userId, { employeeId });
  revalidatePath("/app/users");
}
