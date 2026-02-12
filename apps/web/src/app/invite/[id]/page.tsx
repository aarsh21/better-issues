"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { useAcceptInvitation, useInvitation, useRejectInvitation } from "@/hooks/use-organization";

function UnauthRedirect({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    // Preserve the invite URL so the user can return after sign-in
    const returnTo = encodeURIComponent(`/invite/${inviteId}`);
    router.replace(`/sign-in?returnTo=${returnTo}`);
  }, [router, inviteId]);

  return null;
}

function InviteContent({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const { data: invitation, isPending, isError } = useInvitation(inviteId);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const [outcome, setOutcome] = useState<"accepted" | "rejected" | null>(null);

  const handleAccept = async () => {
    try {
      await acceptInvitation.mutateAsync({ invitationId: inviteId });
      setOutcome("accepted");
      // Navigate to the org after a brief moment
      setTimeout(() => {
        router.push("/org");
      }, 1_500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept invitation";
      setOutcome(null);
      toast.error(message);
    }
  };

  const handleReject = async () => {
    try {
      await rejectInvitation.mutateAsync({ invitationId: inviteId });
      setOutcome("rejected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject invitation";
      setOutcome(null);
      toast.error(message);
    }
  };

  if (isPending) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <CardTitle className="text-sm">Loading invitation...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isError || !invitation) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <CardTitle className="text-sm">Invitation not found</CardTitle>
          <CardDescription>
            This invitation may have expired, been cancelled, or doesn&apos;t exist.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/org")}>
            Go to dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {invitation.status === "accepted" ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-muted-foreground" />
          )}
          <CardTitle className="text-sm">Invitation {invitation.status}</CardTitle>
          <CardDescription>This invitation has already been {invitation.status}.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/org")}>
            Go to dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (outcome === "accepted") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <CardTitle className="text-sm">Invitation accepted</CardTitle>
          <CardDescription>Redirecting to your dashboard...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (outcome === "rejected") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <XCircle className="h-8 w-8 text-muted-foreground" />
          <CardTitle className="text-sm">Invitation declined</CardTitle>
          <CardDescription>You have declined this invitation.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/sign-in")}>
            Go home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Mail className="h-8 w-8 text-muted-foreground" />
        <CardTitle className="text-sm">You&apos;ve been invited</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join as <strong>{invitation.role}</strong>.
          {invitation.expiresAt && (
            <> This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center gap-3 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={rejectInvitation.isPending || acceptInvitation.isPending}
        >
          {rejectInvitation.isPending ? "Declining..." : "Decline"}
        </Button>
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={acceptInvitation.isPending || rejectInvitation.isPending}
        >
          {acceptInvitation.isPending ? "Accepting..." : "Accept Invitation"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function InvitePage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="flex h-svh flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-base font-bold tracking-tight">better-issues</h1>
        <p className="text-xs text-muted-foreground">Issue tracking for small teams</p>
      </div>

      <AuthLoading>
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <CardTitle className="text-sm">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </AuthLoading>

      <Unauthenticated>
        <UnauthRedirect inviteId={params.id} />
      </Unauthenticated>

      <Authenticated>
        <InviteContent inviteId={params.id} />
      </Authenticated>
    </div>
  );
}
