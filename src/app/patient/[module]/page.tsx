import React from "react";
import { getCurrentUser } from "@/lib/auth";
import MinyaRoleModulePage from "@/components/workspace/MinyaRoleModulePage";

export const dynamic = "force-dynamic";

export default async function PatientModulePage({
  params,
}: {
  params: Promise<{ module: string }> | { module: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const user = await getCurrentUser();

  return (
    <MinyaRoleModulePage
      role="patient"
      moduleSlug={resolvedParams.module}
      currentUser={user}
    />
  );
}
