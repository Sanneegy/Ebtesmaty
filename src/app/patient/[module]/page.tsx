import React from "react";
import { getCurrentUser } from "@/lib/auth";
import MinyaRoleModulePage from "@/components/workspace/MinyaRoleModulePage";

export const dynamic = "force-dynamic";

export default async function PatientModulePage({
  params,
}: {
  params: { module: string };
}) {
  const user = await getCurrentUser();

  return (
    <MinyaRoleModulePage
      role="patient"
      moduleSlug={params.module}
      currentUser={user}
    />
  );
}
