import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MinyaRoleModulePage from "@/components/workspace/MinyaRoleModulePage";

export const dynamic = "force-dynamic";

export default async function OwnerModulePage({
  params,
}: {
  params: { module: string };
}) {
  const user = await getCurrentUser();
  if (user && Array.isArray(user.roleGrants) && user.roleGrants.length > 0) {
    const roles = user.roleGrants.map((g: any) => String(g.role).toUpperCase());
    if (!roles.includes("OWNER_ADMIN") && !roles.includes("BRANCH_MANAGER") && !roles.includes("FINANCE")) {
      if (roles.includes("DENTIST")) redirect("/doctor/dashboard");
      if (roles.includes("RECEPTIONIST")) redirect("/reception/dashboard");
      if (roles.includes("PATIENT")) redirect("/patient/dashboard");
    }
  }

  return (
    <MinyaRoleModulePage
      role="clinic_owner"
      moduleSlug={params.module}
      currentUser={user}
    />
  );
}
