"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptInvitation, useInvitation, useRejectInvitation } from "@/hooks/use-organization";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/lib/navigation";

export const Route = createFileRoute("/invite/$id")({
  component: InvitePage,
});

function InvitePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const redirected = useRef(false);
  const session = useSession();

  useEffect(() => {
    if (session.isPending || session.data?.session || redirected.current) {
      return;
    }

    redirected.current = true;
    const returnTo = encodeURIComponent(`/invite/${id}`);
    router.replace(`/sign-in?returnTo=${returnTo}`);
  }, [id, router, session.data?.session, session.isPending]);

  return (
    <div className="flex h-svh flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-base font-bold tracking-tight">better-issues</h1>
        <p className="text-xs text-muted-foreground">Issue tracking for small teams</p>
      </div>

      {session.isPending ? (
        <StatusCard
          icon={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          title="Loading..."
        />
      ) : session.data?.session ? (
        <InviteContent inviteId={id} />
      ) : (
        <StatusCard
          icon={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          title="Redirecting to sign in..."
        />
      )}
    </div>
  );
}

function InviteContent({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const { data: invitation, isPending, isError } = useInvitation(inviteId);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const [outcome, setOutcome] = useState<"accepted" | "rejected" | null>(null);

  if (isPending) {
    return (
      <StatusCard
        icon={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        title="Loading invitation..."
      />
    );
  }

  if (isError || !invitation) {
    return (
      <StatusCard
        icon={<XCircle className="h-8 w-8 text-destructive" />}
        title="Invitation not found"
        description="This invitation may have expired, been cancelled, or doesn't exist."
        actionLabel="Go to teams"
        onAction={() => router.push("/org")}
      />
    );
  }

  if (invitation.status !== "pending") {
    return (
      <StatusCard
        icon={
          invitation.status === "accepted" ? (
            <CheckCircle className="h-8 w-8 text-chart-1" />
          ) : (
            <XCircle className="h-8 w-8 text-muted-foreground" />
          )
        }
        title={`Invitation ${invitation.status}`}
        description={`This invitation has already been ${invitation.status}.`}
        actionLabel="Go to teams"
        onAction={() => router.push("/org")}
      />
    );
  }

  if (outcome === "accepted") {
    return (
      <StatusCard
        icon={<CheckCircle className="h-8 w-8 text-green-600" />}
        title="Invitation accepted"
        description="Redirecting to your workspace..."
      />
    );
  }

  if (outcome === "rejected") {
    return (
      <StatusCard
        icon={<XCircle className="h-8 w-8 text-muted-foreground" />}
        title="Invitation declined"
        description="You have declined this invitation."
        actionLabel="Go to sign in"
        onAction={() => router.push("/sign-in")}
      />
    );
  }

  const handleAccept = async () => {
    const result = await acceptInvitation.mutateAsync({ invitationId: inviteId }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (!result.ok) {
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to accept invitation",
      );
      return;
    }

    setOutcome("accepted");
    window.setTimeout(() => {
      router.push("/org");
    }, 1_000);
  };

  const handleReject = async () => {
    const result = await rejectInvitation.mutateAsync({ invitationId: inviteId }).then(
      () => ({ ok: true }) as const,
      (error: unknown) => ({ ok: false, error }) as const,
    );

    if (!result.ok) {
      toast.error(
        result.error instanceof Error ? result.error.message : "Failed to reject invitation",
      );
      return;
    }

    setOutcome("rejected");
  };

  return (
    <Card className="w-full max-w-sm rounded-none">
      <CardHeader className="items-center text-center">
        <Mail className="h-8 w-8 text-muted-foreground" />
        <CardTitle className="text-sm">You've been invited</CardTitle>
        <CardDescription>
          You've been invited to join as <strong>{invitation.role}</strong>.
          {invitation.expiresAt ? (
            <> This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}.</>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center gap-3 pb-4">
        <Button
          variant="outline"
          size="sm"
          disabled={acceptInvitation.isPending || rejectInvitation.isPending}
          onClick={() => {
            void handleReject();
          }}
        >
          {rejectInvitation.isPending ? "Declining..." : "Decline"}
        </Button>
        <Button
          size="sm"
          disabled={acceptInvitation.isPending || rejectInvitation.isPending}
          onClick={() => {
            void handleAccept();
          }}
        >
          {acceptInvitation.isPending ? "Accepting..." : "Accept Invitation"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="w-full max-w-sm rounded-none">
      <CardHeader className="items-center text-center">
        {icon}
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {actionLabel && onAction ? (
        <CardFooter className="justify-center pb-4">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
