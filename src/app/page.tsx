import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  FileText,
  Users,
  Zap,
  Search,
  Tag,
  Shield,
  Terminal,
} from "lucide-react";

import { MarketingCTA } from "@/components/marketing-cta";

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-bold tracking-tight">
            better-issues
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="#features"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              How it works
            </Link>
            <MarketingCTA />
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 border bg-card px-3 py-1">
              <span className="h-1.5 w-1.5 bg-green-500" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Built for small teams
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Issue tracking
              <br />
              <span className="text-muted-foreground">without the bloat.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              A fast, focused issue tracker for teams that ship. Type-safe templates, real-time
              updates, and a UI that gets out of your way.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start tracking
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 border px-5 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                See features
              </Link>
            </div>
          </div>

          {/* Terminal preview */}
          <div className="mt-16 border bg-card sm:mt-20">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <div className="h-2.5 w-2.5 border border-muted-foreground/30" />
              <div className="h-2.5 w-2.5 border border-muted-foreground/30" />
              <div className="h-2.5 w-2.5 border border-muted-foreground/30" />
              <span className="ml-3 text-[10px] text-muted-foreground">better-issues</span>
            </div>
            <div className="p-4 text-xs leading-loose text-muted-foreground sm:p-6">
              <div className="flex items-center gap-3">
                <CircleDot className="h-3.5 w-3.5 text-green-500" />
                <span className="w-10 font-mono text-foreground/40">#42</span>
                <span className="text-foreground">Fix auth redirect on session expiry</span>
                <span className="ml-auto hidden border px-1.5 py-0.5 text-[10px] sm:inline">
                  urgent
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CircleDot className="h-3.5 w-3.5 text-blue-500" />
                <span className="w-10 font-mono text-foreground/40">#41</span>
                <span className="text-foreground">Add search index for issue titles</span>
                <span className="ml-auto hidden border px-1.5 py-0.5 text-[10px] sm:inline">
                  high
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CircleDot className="h-3.5 w-3.5 text-yellow-500" />
                <span className="w-10 font-mono text-foreground/40">#40</span>
                <span className="text-foreground">Template schema validation edge case</span>
                <span className="ml-auto hidden border px-1.5 py-0.5 text-[10px] sm:inline">
                  medium
                </span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="w-10 font-mono text-foreground/40">#39</span>
                <span className="text-foreground line-through">Update dependencies to latest</span>
                <span className="ml-auto hidden border px-1.5 py-0.5 text-[10px] sm:inline">
                  low
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section id="features" className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="mb-12">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Features
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need.
              <br />
              Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Real-time"
              description="Issues update instantly across all connected clients. No refresh required."
            />
            <FeatureCard
              icon={FileText}
              title="Type-safe templates"
              description="Define issue templates with JSON schemas. Validated at creation, enforced at runtime."
            />
            <FeatureCard
              icon={Users}
              title="Team management"
              description="Invite members, assign roles, control who can do what with fine-grained permissions."
            />
            <FeatureCard
              icon={Search}
              title="Instant search"
              description="Full-text search across all issues. Hit Cmd+K and find anything in milliseconds."
            />
            <FeatureCard
              icon={Tag}
              title="Labels & filters"
              description="Categorize with custom labels. Filter by status, priority, or any combination."
            />
            <FeatureCard
              icon={Shield}
              title="Role-based access"
              description="Owner, admin, member roles with granular permissions for issues, labels, and templates."
            />
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="mb-12">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Three steps to sanity.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <StepCard
              step="01"
              title="Create a team"
              description="Set up your workspace in seconds. Name it, invite your people, you're live."
            />
            <StepCard
              step="02"
              title="Define templates"
              description="Build structured issue templates with custom fields. Bug reports, feature requests, whatever your team needs."
            />
            <StepCard
              step="03"
              title="Track & ship"
              description="Create issues, assign priority, filter and search. Everything updates in real-time."
            />
          </div>
        </div>
      </section>

      {/* ─── Tech ────────────────────────────────────────── */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center">
            <Terminal className="mb-6 h-8 w-8 text-muted-foreground" />
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Built different.</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Next.js for the frontend. Convex for real-time backend. Better Auth for security.
              Every piece chosen for speed and developer experience.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              {["Next.js", "React", "Convex", "Better Auth", "Tailwind CSS", "TypeScript"].map(
                (tech) => (
                  <span key={tech} className="border px-3 py-1.5">
                    {tech}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="border bg-card p-8 text-center sm:p-16">
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to stop losing track?
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-sm text-muted-foreground">
              Set up your team in under a minute. No credit card, no setup wizard, no nonsense.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <span className="text-xs text-muted-foreground">better-issues</span>
          <span className="text-[10px] text-muted-foreground">
            Built with care for small teams.
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background p-6 sm:p-8">
      <Icon className="mb-4 h-5 w-5 text-muted-foreground" />
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border p-6">
      <span className="mb-4 block text-3xl font-bold text-muted-foreground/20">{step}</span>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
