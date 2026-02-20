import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/ui/link";
import {
  ArrowRight,
  CircleDot,
  Zap,
  Users,
  Search,
  Tag,
  Shield,
  FileText,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { MarketingCTA } from "@/components/marketing-cta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background text-foreground selection:bg-primary/20">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold tracking-tight">better-issues</span>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="#features"
                className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#workflow"
                className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Workflow
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com"
              className="hidden text-[10px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              GitHub
            </Link>
            <MarketingCTA />
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="mb-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-chart-1" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Open source &middot; Self-hostable &middot; Unlicensed
            </span>
          </div>

          <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Issue tracking
            <br />
            for teams that
            <br />
            value simplicity.
          </h1>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
            >
              Try the demo
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="https://github.com/aarsh21/better-issues"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              <GitBranch className="h-3 w-3" />
              Source code
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid ───────────────────────────────────── */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Features
          </p>
          <h2 className="mb-10 text-xl font-bold tracking-tight sm:text-2xl">
            Everything in one place.
          </h2>

          {/* Row 1: Large + Small */}
          <div className="grid gap-px bg-border sm:grid-cols-5">
            {/* Large card: Real-time preview */}
            <div className="col-span-full border border-border bg-background p-6 sm:col-span-3 sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold">Real-time updates</span>
              </div>
              <p className="mb-6 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                Every change syncs instantly across all connected clients. When someone updates an
                issue, everyone sees it. No refresh needed.
              </p>
              {/* Mini issue list preview */}
              <div className="border border-border bg-card">
                {[
                  {
                    id: "#12",
                    title: "Add dark mode toggle",
                    status: "open",
                    color: "text-chart-1",
                  },
                  {
                    id: "#11",
                    title: "Fix sidebar collapse",
                    status: "in_progress",
                    color: "text-chart-4",
                  },
                  {
                    id: "#10",
                    title: "Update search index",
                    status: "closed",
                    color: "text-muted-foreground",
                  },
                ].map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
                  >
                    <CircleDot className={cn("h-3 w-3", issue.color)} />
                    <span className="text-[10px] text-muted-foreground">{issue.id}</span>
                    <span
                      className={cn(
                        "text-[11px]",
                        issue.status === "closed" && "text-muted-foreground line-through",
                      )}
                    >
                      {issue.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Small cards stack */}
            <div className="col-span-full flex flex-col gap-px sm:col-span-2">
              <div className="flex-1 border border-border bg-background p-6">
                <FileText className="mb-3 h-4 w-4 text-muted-foreground" />
                <h3 className="mb-1.5 text-xs font-bold">Issue templates</h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Define structured templates with custom fields. Text inputs, dropdowns,
                  checkboxes, file uploads.
                </p>
              </div>
              <div className="flex-1 border border-border bg-background p-6">
                <Users className="mb-3 h-4 w-4 text-muted-foreground" />
                <h3 className="mb-1.5 text-xs font-bold">Team management</h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Invite by email, assign roles. Owner, admin, and member permissions built in.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Three equal */}
          <div className="mt-px grid gap-px bg-border sm:grid-cols-3">
            <div className="border border-border bg-background p-6">
              <Search className="mb-3 h-4 w-4 text-muted-foreground" />
              <h3 className="mb-1.5 text-xs font-bold">Command palette</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Hit Cmd+K to search issues, switch teams, or jump to any action. Full-text search
                across everything.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
                <span className="border border-border px-1 text-[9px]">&#8984;</span>
                <span className="border border-border px-1 text-[9px]">K</span>
                <span className="ml-1">to search</span>
              </div>
            </div>

            <div className="border border-border bg-background p-6">
              <Tag className="mb-3 h-4 w-4 text-muted-foreground" />
              <h3 className="mb-1.5 text-xs font-bold">Labels and filters</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Create custom labels with colors. Filter issues by status, priority, label, or any
                combination.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  { label: "bug", color: "bg-destructive/20 text-destructive" },
                  { label: "feature", color: "bg-chart-1/20 text-chart-1" },
                  { label: "docs", color: "bg-chart-4/20 text-chart-4" },
                ].map((l) => (
                  <span
                    key={l.label}
                    className={cn("px-1.5 py-0.5 text-[9px] font-medium", l.color)}
                  >
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-border bg-background p-6">
              <Shield className="mb-3 h-4 w-4 text-muted-foreground" />
              <h3 className="mb-1.5 text-xs font-bold">Self-hosted</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Your data on your servers. Deploy anywhere you want. Open source, unlicensed, no
                vendor lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflow ─────────────────────────────────────── */}
      <section id="workflow" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Workflow
          </p>
          <h2 className="mb-10 text-xl font-bold tracking-tight sm:text-2xl">Simple by design.</h2>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="border border-border p-6">
              <div className="mb-4 flex h-8 w-8 items-center justify-center bg-primary/10">
                <AlertCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="mb-1.5 text-xs font-bold">Open</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Create an issue from a template. Set priority, assign labels, add to your
                team&apos;s backlog.
              </p>
            </div>
            <div className="border border-border p-6">
              <div className="mb-4 flex h-8 w-8 items-center justify-center bg-chart-4/10">
                <Clock className="h-3.5 w-3.5 text-chart-4" />
              </div>
              <h3 className="mb-1.5 text-xs font-bold">In progress</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Move issues to in-progress when work begins. Everyone sees the status change in
                real-time.
              </p>
            </div>
            <div className="border border-border p-6">
              <div className="mb-4 flex h-8 w-8 items-center justify-center bg-chart-1/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-1" />
              </div>
              <h3 className="mb-1.5 text-xs font-bold">Closed</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Resolve issues when done. They stay searchable and visible in your project history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">
              Start tracking issues today.
            </h2>
            <p className="mb-8 max-w-sm text-xs text-muted-foreground">
              Clone the repo, deploy it, and you&apos;re ready. No accounts to create, no services
              to subscribe to.
            </p>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
            >
              Try the demo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <span className="text-[10px] text-muted-foreground">better-issues</span>
          <span className="text-[10px] text-muted-foreground">Unlicensed &middot; Open source</span>
        </div>
      </footer>
    </div>
  );
}
