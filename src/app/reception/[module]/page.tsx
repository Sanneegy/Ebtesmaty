import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MinyaRoleModulePage from "@/components/workspace/MinyaRoleModulePage";

export const dynamic = "force-dynamic";

export default async function ReceptionModulePage({
  params,
}: {
  params: Promise<{ module: string }> | { module: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const user = await getCurrentUser();
  if (user && Array.isArray(user.roleGrants) && user.roleGrants.length > 0) {
    const roles = user.roleGrants.map((g: any) => String(g.role).toUpperCase());
    if (
      !roles.includes("RECEPTIONIST") &&
      !roles.includes("BRANCH_MANAGER") &&
      !roles.includes("OWNER_ADMIN")
    ) {
      if (roles.includes("DENTIST")) redirect("/doctor/dashboard");
      if (roles.includes("PATIENT")) redirect("/patient/dashboard");
    }
  }

  return (
    <MinyaRoleModulePage
      role="receptionist"
      moduleSlug={resolvedParams.module}
      currentUser={user}
    />
  );
}
