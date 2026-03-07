"use client";

import { useQuery } from "@tanstack/react-query";

import { sessionQueryOptions } from "@better-issues/api-client";

import { authClient } from "@/lib/auth-client";

export function useSession() {
  return authClient.useSession();
}

export function useCurrentUser() {
  return useQuery(sessionQueryOptions());
}
