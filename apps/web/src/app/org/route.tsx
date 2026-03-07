"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/org")({
  component: OrgRoute,
});

function OrgRoute() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}
