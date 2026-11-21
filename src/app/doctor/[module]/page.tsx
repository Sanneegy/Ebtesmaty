import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MinyaRoleModulePage from "@/components/workspace/MinyaRoleModulePage";

export const dynamic = "force-dynamic";

export default async function DoctorModulePage({
  params,
}: {
  params: { module: string };
}) {
  const user = await getCurrentUser();
  if (user && Array.isArray(user.roleGrants) && user.roleGrants.length > 0) {
    const roles = user.roleGrants.map((g: any) => String(g.role).toUpperCase());
    if (!roles.includes("DENTIST") && !roles.includes("OWNER_ADMIN")) {
      if (roles.includes("RECEPTIONIST")) redirect("/reception/dashboard");
      if (roles.includes("PATIENT")) redirect("/patient/dashboard");
    }
  }

  return (
    <MinyaRoleModulePage
      role="doctor"
      moduleSlug={params.module}
      currentUser={user}
    />
  );
}
