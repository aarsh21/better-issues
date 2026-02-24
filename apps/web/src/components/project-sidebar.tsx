"use client";

import { getRouteApi, useLocation } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import {
  CircleDot,
  Command,
  Settings,
  Plus,
  Search,
  LayoutList,
  Tag,
  ChevronsUpDown,
  Check,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Users,
} from "lucide-react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { api } from "@/convex";
import { authClient } from "@/lib/auth-client";
import { clearIssueSnapshots } from "@/lib/issue-snapshot-cache";
import { useRouter } from "@/lib/navigation";
import { prefetchRouteData } from "@/lib/route-prefetch";
import { cn } from "@/lib/utils";
import {
  useOrganizations,
  useActiveOrganization,
  useSetActiveOrganization,
} from "@/hooks/use-organization";
import { getShortcutDisplayParts, useShortcutSettings } from "@/hooks/use-keybinds";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { CreateOrgDialog } from "./create-org-dialog";

const orgRouteApi = getRouteApi("/org/$slug");

export function ProjectSidebar({
  onSearchOpen,
  onActionCommandOpen,
}: {
  onSearchOpen?: () => void;
  onActionCommandOpen?: () => void;
}) {
  const router = useRouter();
  const { shortcuts } = useShortcutSettings();
  const { slug } = orgRouteApi.useParams();
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const searchString = useLocation({
    select: (location) => location.searchStr,
  });
  const activeStatus = new URLSearchParams(searchString).get("status");
  const isOnIssuesPage = pathname === `/org/${slug}`;
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="md:pt-10">
          <TeamSwitcher onCreateOrg={() => setCreateOrgOpen(true)} />
        </SidebarHeader>

        <SidebarContent>
          {/* Quick Actions */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Search issues" onClick={onSearchOpen}>
                    <Search />
                    <span>Search</span>
                    <KbdGroup className="ml-auto text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                      {getShortcutDisplayParts(shortcuts.search).map((part) => (
                        <Kbd
                          key={`search-shortcut-${part}`}
                          className="h-6 min-w-6 px-2 text-sm font-semibold"
                        >
                          {part}
                        </Kbd>
                      ))}
                    </KbdGroup>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Command options" onClick={onActionCommandOpen}>
                    <Command />
                    <span>Commands</span>
                    <KbdGroup className="ml-auto text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                      {getShortcutDisplayParts(shortcuts.commandPrompt).map((part) => (
                        <Kbd
                          key={`command-shortcut-${part}`}
                          className="h-6 min-w-6 px-2 text-sm font-semibold"
                        >
                          {part}
                        </Kbd>
                      ))}
                    </KbdGroup>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="New Issue"
                    onClick={() => router.push(`/org/${slug}/issues/new`)}
                  >
                    <Plus />
                    <span>New Issue</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem
                  href={`/org/${slug}`}
                  label="Issues"
                  tooltip="Issues"
                  icon={CircleDot}
                  active={isOnIssuesPage && activeStatus === null}
                />
                <NavItem
                  href={`/org/${slug}/settings`}
                  label="Settings"
                  tooltip="Settings"
                  icon={Settings}
                  active={pathname.startsWith(`/org/${slug}/settings`)}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Quick Filters */}
          <SidebarGroup>
            <SidebarGroupLabel>Filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <Suspense
                fallback={
                  <SidebarMenu>
                    <NavItem
                      href={`/org/${slug}?status=open`}
                      icon={LayoutList}
                      label="Open"
                      tooltip="Open issues"
                      active={false}
                    />
                    <NavItem
                      href={`/org/${slug}?status=in_progress`}
                      icon={CircleDot}
                      label="In Progress"
                      tooltip="In progress issues"
                      active={false}
                    />
                    <NavItem
                      href={`/org/${slug}?status=closed`}
                      icon={Tag}
                      label="Closed"
                      tooltip="Closed issues"
                      active={false}
                    />
                  </SidebarMenu>
                }
              >
                <QuickFilters slug={slug} pathname={pathname} />
              </Suspense>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <UserNavMenu />
        </SidebarFooter>
      </Sidebar>

      <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </>
  );
}

/* ── Nav Item (uses onClick for navigation to avoid render prop conflicts) ── */

function NavItem({
  href,
  icon: Icon,
  label,
  tooltip,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip: string;
  active: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    router.prefetch(href);
    void prefetchRouteData(href, queryClient).catch(() => undefined);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={tooltip}
        isActive={active}
        onMouseEnter={handleMouseEnter}
        onClick={() => router.push(href)}
        className="cursor-pointer"
      >
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ── Team Switcher ────────────────────────────────────────────── */

function TeamSwitcher({ onCreateOrg }: { onCreateOrg: () => void }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: orgs } = useOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const setActive = useSetActiveOrganization();

  const handleSelect = (orgSlug: string) => {
    if (orgSlug === activeOrg?.slug) {
      return;
    }

    router.push(`/org/${orgSlug}`);
    setActive.mutate({ organizationSlug: orgSlug });
  };

  const initial = activeOrg?.name?.charAt(0)?.toUpperCase() ?? "T";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-none p-2 text-left text-xs",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground",
              "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
              "outline-hidden cursor-pointer",
            )}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center text-xs font-semibold">
              {initial}
            </div>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-semibold text-sidebar-foreground">
                {activeOrg?.name ?? "Select team"}
              </span>
              <span className="truncate text-[10px] text-sidebar-foreground/60">
                {activeOrg?.slug ?? ""}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
              {orgs?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelect(org.slug)}
                  className="cursor-pointer gap-2 p-2"
                >
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center text-[10px] font-semibold">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate font-mono text-xs">{org.name}</span>
                  {activeOrg?.id === org.id && <Check className="ml-auto h-3.5 w-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateOrg} className="cursor-pointer gap-2 p-2">
              <div className="flex size-6 items-center justify-center border border-dashed">
                <Plus className="size-3.5" />
              </div>
              <span className="text-xs text-muted-foreground">Create team</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/* ── User Nav Menu (Footer) ──────────────────────────────────── */

function UserNavMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser));
  const { setTheme, theme } = useTheme();

  if (!user) return null;

  const initial = user.name?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-none p-2 text-left text-xs",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground",
              "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
              "outline-hidden cursor-pointer",
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-semibold text-sidebar-foreground">
                {user.name ?? "User"}
              </span>
              <span className="truncate text-[10px] text-sidebar-foreground/60">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
                    <AvatarFallback className="text-xs font-semibold">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-xs font-semibold">{user.name ?? "User"}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/org")}
                className="cursor-pointer gap-2"
              >
                <Users className="size-4" />
                Teams
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2">
                <Sun className="size-4" />
                Light
                {theme === "light" && <Check className="ml-auto size-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2">
                <Moon className="size-4" />
                Dark
                {theme === "dark" && <Check className="ml-auto size-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2">
                <Monitor className="size-4" />
                System
                {theme === "system" && <Check className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      queryClient.clear();
                      clearIssueSnapshots();
                      router.push("/");
                    },
                  },
                });
              }}
            >
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/* ── Quick Filters ───────────────────────────────────────────── */

function QuickFilters({ slug, pathname }: { slug: string; pathname: string }) {
  const searchString = useLocation({
    select: (location) => location.searchStr,
  });
  const activeStatus = new URLSearchParams(searchString).get("status");
  const isOnIssuesPage = pathname === `/org/${slug}`;

  return (
    <SidebarMenu>
      <NavItem
        href={`/org/${slug}?status=open`}
        icon={LayoutList}
        label="Open"
        tooltip="Open issues"
        active={isOnIssuesPage && activeStatus === "open"}
      />
      <NavItem
        href={`/org/${slug}?status=in_progress`}
        icon={CircleDot}
        label="In Progress"
        tooltip="In progress issues"
        active={isOnIssuesPage && activeStatus === "in_progress"}
      />
      <NavItem
        href={`/org/${slug}?status=closed`}
        icon={Tag}
        label="Closed"
        tooltip="Closed issues"
        active={isOnIssuesPage && activeStatus === "closed"}
      />
    </SidebarMenu>
  );
}
