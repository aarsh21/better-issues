import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/ui/link";
import { CircleDot, FileText, Users, Search, Tag, Github } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketingCTA } from "@/components/marketing-cta";

export const Route = createFileRoute("/")({
  component: MinimalHomePage,
});

export default function MinimalHomePage() {
  return (
    <div className="min-h-svh bg-background text-foreground font-sans relative">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* ─── Marquee Banner ─────────────────────────────── */}
      <div className="bg-primary/10 text-primary overflow-hidden py-1.5 border-b border-primary/20 absolute top-0 w-full z-50">
        <div className="animate-marquee gap-8 min-w-[200%] text-[11px] font-medium uppercase tracking-[0.2em]">
          {[...Array(15)].map((_, i) => (
            <span key={i} className="flex items-center gap-3">
              <span>STILL IN ALPHA</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-12 inset-x-0 z-40 flex justify-center px-4">
        <div className="flex h-12 items-center gap-8 rounded-full border border-border/50 bg-background/80 backdrop-blur-md px-6 shadow-sm">
          <Link href="/" className="text-sm font-medium tracking-wide flex items-center gap-2">
            better-issues
          </Link>
          <div className="h-4 w-px bg-border/50"></div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <a href="https://github.com/aarsh21/better-issues" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
          <div className="h-4 w-px bg-border/50 hidden sm:block"></div>
          <div className="hidden sm:block">
            <MarketingCTA />
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="flex min-h-svh flex-col items-center justify-center px-6 pt-24 text-center">
        <h1 className="max-w-3xl text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[1.15]">
          better-issues
        </h1>

        <p className="mt-8 max-w-2xl text-lg font-light text-muted-foreground sm:text-xl">
          An open-source issue tracker. Features real-time updates, structured schemas, and basic team management capabilities.
        </p>

        <div className="mt-12 flex items-center gap-4">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "rounded-full px-8 font-medium")}
          >
            Open App
          </Link>
          <a
            href="https://github.com/aarsh21/better-issues"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8 font-medium")}
          >
            Source Code
          </a>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section id="features" className="px-6 py-32 sm:py-48 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <div className="mb-24 text-center">
            <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">Available Features</h2>
          </div>

          <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureItem icon={CircleDot} title="Real-time Synchronization" description="Data updates across active clients concurrently via websockets." />
            <FeatureItem icon={FileText} title="JSON Schemas" description="Configure issue templates to require specific fields upon creation." />
            <FeatureItem icon={Users} title="Workspace Management" description="Create organizations, invite users, and assign basic roles." />
            <FeatureItem icon={Search} title="Command Menu" description="Keyboard-accessible menu for searching issues and navigating." />
            <FeatureItem icon={Tag} title="Labels & Filtering" description="Apply custom labels to issues and filter views accordingly." />
            <FeatureItem icon={Github} title="Open Source" description="The project repository is public for community review and self-hosting." />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string, strokeWidth?: number }>; title: string; description: string }) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/50 text-secondary-foreground transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-6 w-6 font-light" strokeWidth={1.5} />
      </div>
      <h3 className="mb-3 text-lg font-medium text-foreground">{title}</h3>
      <p className="text-sm font-light leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
