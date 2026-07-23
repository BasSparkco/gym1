"use server";

import { updateEmployee, upsertCoachProfile, removeCoachProfile } from "@/lib/employees";
import { revalidatePath } from "next/cache";

export async function updateEmployeeAction(formData: FormData) {
  const employeeId = formData.get("employeeId") as string;
  const salaryRaw = formData.get("salary") as string;

  await updateEmployee(employeeId, {
    fullName: formData.get("fullName") as string,
    branchId: formData.get("branchId") as string,
    idNumber: (formData.get("idNumber") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    sex: (formData.get("sex") as "male" | "female") || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    job: (formData.get("job") as string) || undefined,
    salary: salaryRaw ? Number(salaryRaw) : undefined,
    workType: (formData.get("workType") as "fullTime" | "partTime" | "trainee") || undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
  });

  const isCoach = formData.get("isCoach") === "true";
  if (isCoach) {
    const specializations = ((formData.get("specializations") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const certifications = ((formData.get("certifications") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await upsertCoachProfile(employeeId, { specializations, certifications });
  } else {
    await removeCoachProfile(employeeId);
  }

  revalidatePath("/app/employees");
}

export async function toggleEmployeeStatusAction(formData: FormData) {
  const employeeId = formData.get("employeeId") as string;
  const currentStatus = formData.get("currentStatus") as "active" | "inactive";
  await updateEmployee(employeeId, {
    status: currentStatus === "active" ? "inactive" : "active",
  });
  revalidatePath("/app/employees");
}
